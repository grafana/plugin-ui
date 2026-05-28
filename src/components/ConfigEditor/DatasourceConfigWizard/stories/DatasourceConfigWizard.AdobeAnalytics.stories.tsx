import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import adobeAnalyticsSchemaJson from '../../../../schema/registry/grafana-adobeanalytics-datasource.schema.json';

const schema = adobeAnalyticsSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Adobe Analytics',
  id: 1,
  uid: 'adobe-fresh',
  type: 'grafana-adobeanalytics-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Adobe Analytics Production',
  id: 2,
  uid: 'adobe-full',
  type: 'grafana-adobeanalytics-datasource',
  url: '',
  jsonData: {
    variables: {
      global_company_id: 'mycompany',
    },
    services: {
      adobe_analytics: {
        server: { id: 'adobeanalytics_api' },
        auth: {
          id: 'oauth2_m2m',
          clientId: 'abc123-client-id',
        },
      },
    },
  },
  secureJsonFields: {
    'adobe_analytics.clientSecret': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'adobe-full-ro',
  id: 3,
  name: 'Adobe Analytics Production (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'adobe-fresh': fresh,
  'adobe-full': fullyConfigured,
  'adobe-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Adobe Analytics',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => (
  <StoryModeWrapper schema={schema} dsUid="adobe-fresh" dsName="Adobe Analytics" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="adobe-full" dsName="Adobe Analytics Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper
    schema={schema}
    dsUid="adobe-full-ro"
    dsName="Adobe Analytics Production (provisioned)"
    onSuccess={noop}
  />
);
ReadOnly.storyName = 'Read-only (provisioned)';
