import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import splunkSchemaJson from '../../../../schema/registry/grafana-splunk-datasource.schema.json';

const schema = splunkSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Splunk',
  id: 1,
  uid: 'splunk-fresh',
  type: 'grafana-splunk-datasource',
  url: '',
  basicAuth: true,
  jsonData: {
    authType: 'BasicAuth',
  },
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Splunk Production',
  id: 2,
  uid: 'splunk-full',
  type: 'grafana-splunk-datasource',
  url: 'https://splunk8-int-api.grafana.net',
  basicAuth: true,
  basicAuthUser: 'admin',
  jsonData: {
    authType: 'BasicAuth',
    autoCancel: '30',
    timeoutInSeconds: 30,
    statusBuckets: '30',
    internalFieldsFiltration: true,
    internalFieldPattern: '^_.+',
    tsField: '_time',
    fieldSearchType: 'quick',
    variableSearchLevel: 'fast',
    defaultEarliestTime: '-1hr',
    maxResultCount: 0,
    previewMode: false,
    pollSearchResult: false,
    dataLinks: [
      {
        field: '',
        matcherRegex: '',
        url: '',
        urlDisplayLabel: '',
        datasourceUid: '',
      },
    ],
  },
  secureJsonFields: {
    basicAuthPassword: true,
  },
};

const tokenAuth: Record<string, unknown> = {
  name: 'Splunk Token Auth',
  id: 3,
  uid: 'splunk-token',
  type: 'grafana-splunk-datasource',
  url: 'https://splunk.example.com:8089',
  basicAuth: false,
  jsonData: {
    authType: 'custom-splunk',
    tsField: '_time',
    fieldSearchType: 'quick',
    variableSearchLevel: 'fast',
  },
  secureJsonFields: {
    authToken: true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'splunk-full-ro',
  id: 4,
  name: 'Splunk Production (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'splunk-fresh': fresh,
  'splunk-full': fullyConfigured,
  'splunk-token': tokenAuth,
  'splunk-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Splunk',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="splunk-fresh" dsName="Splunk" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="splunk-full" dsName="Splunk Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const TokenAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="splunk-token" dsName="Splunk Token Auth" onSuccess={noop} />
);
TokenAuth.storyName = 'Token authentication';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="splunk-full-ro" dsName="Splunk Production (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
