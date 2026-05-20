import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import lokiSchemaJson from '../../../../datasource/schema/datasources/loki.schema.json';

const schema = lokiSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Loki',
  id: 1,
  uid: 'loki-fresh',
  type: 'loki',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Loki Production',
  id: 2,
  uid: 'loki-full',
  type: 'loki',
  url: 'http://loki-gateway:3100',
  basicAuth: false,
  jsonData: {
    maxLines: '5000',
    manageAlerts: true,
    alertmanager: 'alertmanager-uid',
  },
  secureJsonFields: {},
};

const derivedFieldsConfigured: Record<string, unknown> = {
  name: 'Loki with Derived Fields',
  id: 3,
  uid: 'loki-derived',
  type: 'loki',
  url: 'http://loki:3100',
  jsonData: {
    maxLines: '1000',
    derivedFields: [
      {
        name: 'TraceID',
        matcherRegex: 'traceID=(\\w+)',
        url: '',
        urlDisplayLabel: '',
        datasourceUid: 'tempo-uid',
        matcherType: 'regex',
      },
      {
        name: 'RequestID',
        matcherRegex: 'request_id',
        url: 'https://example.com/requests/${__value.raw}',
        urlDisplayLabel: 'View Request',
        matcherType: 'label',
        targetBlank: true,
      },
    ],
  },
  secureJsonFields: {},
};

const basicAuth: Record<string, unknown> = {
  name: 'Loki Basic Auth',
  id: 4,
  uid: 'loki-basic-auth',
  type: 'loki',
  url: 'http://loki:3100',
  basicAuth: true,
  basicAuthUser: 'loki-user',
  jsonData: {
    maxLines: '1000',
  },
  secureJsonFields: {
    basicAuthPassword: true,
  },
};

const mocks: Record<string, Record<string, unknown>> = {
  'loki-fresh': fresh,
  'loki-full': fullyConfigured,
  'loki-derived': derivedFieldsConfigured,
  'loki-basic-auth': basicAuth,
};

// ============================================================
// Backend mock
// ============================================================

function mockBackendSrv() {
  setBackendSrv({
    get: (url: string) => {
      const uid = url.replace('/api/datasources/uid/', '');
      const ds = mocks[uid];
      if (ds) {
        return Promise.resolve(ds);
      }
      return Promise.reject(new Error(`Datasource ${uid} not found`));
    },
    put: () => Promise.resolve({}),
  } as unknown as BackendSrv);
}

// ============================================================
// Stories
// ============================================================

export default {
  title: 'Editors/Config/Loki',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="loki-fresh" dsName="Loki" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="loki-full" dsName="Loki Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const DerivedFieldsConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="loki-derived" dsName="Loki with Derived Fields" onSuccess={noop} />
);
DerivedFieldsConfigured.storyName = 'Derived fields configured';

export const BasicAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="loki-basic-auth" dsName="Loki Basic Auth" onSuccess={noop} />
);
BasicAuth.storyName = 'Basic authentication';
