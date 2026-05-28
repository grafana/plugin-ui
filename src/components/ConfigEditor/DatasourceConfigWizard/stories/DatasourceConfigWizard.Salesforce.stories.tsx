import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import salesforceSchemaJson from '../../../../schema/registry/grafana-salesforce-datasource.schema.json';

const schema = salesforceSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Salesforce',
  id: 1,
  uid: 'sf-fresh',
  type: 'grafana-salesforce-datasource',
  url: '',
  jsonData: {
    authType: 'user',
  },
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Salesforce Production',
  id: 2,
  uid: 'sf-full',
  type: 'grafana-salesforce-datasource',
  url: '',
  jsonData: {
    authType: 'user',
    user: 'admin@mycompany.com',
    tokenUrl: 'https://login.salesforce.com',
  },
  secureJsonFields: {
    password: true,
    securityToken: true,
    clientID: true,
    clientSecret: true,
  },
};

const jwtAuth: Record<string, unknown> = {
  name: 'Salesforce JWT',
  id: 3,
  uid: 'sf-jwt',
  type: 'grafana-salesforce-datasource',
  url: '',
  jsonData: {
    authType: 'jwt',
    user: 'integration@mycompany.com',
    tokenUrl: 'https://login.salesforce.com',
  },
  secureJsonFields: {
    cert: true,
    privateKey: true,
    clientID: true,
  },
};

const sandbox: Record<string, unknown> = {
  name: 'Salesforce Sandbox',
  id: 4,
  uid: 'sf-sandbox',
  type: 'grafana-salesforce-datasource',
  url: '',
  jsonData: {
    authType: 'user',
    user: 'developer@mycompany.com.sandbox',
    tokenUrl: 'https://test.salesforce.com',
    sandbox: true,
  },
  secureJsonFields: {
    password: true,
    securityToken: true,
    clientID: true,
    clientSecret: true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'sf-full-ro',
  id: 5,
  name: 'Salesforce Production (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'sf-fresh': fresh,
  'sf-full': fullyConfigured,
  'sf-jwt': jwtAuth,
  'sf-sandbox': sandbox,
  'sf-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Salesforce',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="sf-fresh" dsName="Salesforce" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="sf-full" dsName="Salesforce Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const JwtAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="sf-jwt" dsName="Salesforce JWT" onSuccess={noop} />
);
JwtAuth.storyName = 'JWT authentication';

export const Sandbox = () => (
  <StoryModeWrapper schema={schema} dsUid="sf-sandbox" dsName="Salesforce Sandbox" onSuccess={noop} />
);
Sandbox.storyName = 'Sandbox environment';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="sf-full-ro" dsName="Salesforce Production (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
