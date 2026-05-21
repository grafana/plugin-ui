import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import stackdriverSchemaJson from '../../../../schema/registry/stackdriver.schema.json';

const schema = stackdriverSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Google Cloud Monitoring',
  id: 40,
  uid: 'gcm-fresh',
  type: 'stackdriver',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const jwtConfigured: Record<string, unknown> = {
  name: 'Google Cloud Monitoring (JWT — private key)',
  id: 41,
  uid: 'gcm-jwt',
  type: 'stackdriver',
  url: '',
  jsonData: {
    authenticationType: 'jwt',
    defaultProject: 'grafana-prod',
    clientEmail: 'test-service-account@grafana-prod.iam.gserviceaccount.com',
    tokenUri: 'https://oauth2.googleapis.com/token',
  },
  secureJsonFields: {
    privateKey: true,
  },
};

const jwtKeyPathConfigured: Record<string, unknown> = {
  name: 'Google Cloud Monitoring (JWT — key path)',
  id: 42,
  uid: 'gcm-jwt-path',
  type: 'stackdriver',
  url: '',
  jsonData: {
    authenticationType: 'jwt',
    defaultProject: 'grafana-prod',
    clientEmail: 'test-service-account@grafana-prod.iam.gserviceaccount.com',
    tokenUri: 'https://oauth2.googleapis.com/token',
    privateKeyPath: '/etc/secrets/gce.pem',
  },
  secureJsonFields: {},
};

const gceConfigured: Record<string, unknown> = {
  name: 'Google Cloud Monitoring (GCE)',
  id: 43,
  uid: 'gcm-gce',
  type: 'stackdriver',
  url: '',
  jsonData: {
    authenticationType: 'gce',
    defaultProject: 'grafana-prod',
  },
  secureJsonFields: {},
};

const gceWithImpersonation: Record<string, unknown> = {
  name: 'Google Cloud Monitoring (GCE + Impersonation)',
  id: 44,
  uid: 'gcm-gce-imp',
  type: 'stackdriver',
  url: '',
  jsonData: {
    authenticationType: 'gce',
    defaultProject: 'grafana-prod',
    usingImpersonation: true,
    serviceAccountToImpersonate: 'impersonated@grafana-prod.iam.gserviceaccount.com',
  },
  secureJsonFields: {},
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...jwtConfigured,
  uid: 'gcm-ro',
  id: 45,
  name: 'Google Cloud Monitoring (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'gcm-fresh': fresh,
  'gcm-jwt': jwtConfigured,
  'gcm-jwt-path': jwtKeyPathConfigured,
  'gcm-gce': gceConfigured,
  'gcm-gce-imp': gceWithImpersonation,
  'gcm-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Google Cloud Monitoring',
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
  <StoryModeWrapper schema={schema} dsUid="gcm-fresh" dsName="Google Cloud Monitoring" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const JWTConfigured = () => (
  <StoryModeWrapper
    schema={schema}
    dsUid="gcm-jwt"
    dsName="Google Cloud Monitoring (JWT — private key)"
    onSuccess={noop}
  />
);
JWTConfigured.storyName = 'JWT configured (private key)';

export const JWTKeyPathConfigured = () => (
  <StoryModeWrapper
    schema={schema}
    dsUid="gcm-jwt-path"
    dsName="Google Cloud Monitoring (JWT — key path)"
    onSuccess={noop}
  />
);
JWTKeyPathConfigured.storyName = 'JWT configured (key path)';

export const GCEConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="gcm-gce" dsName="Google Cloud Monitoring (GCE)" onSuccess={noop} />
);
GCEConfigured.storyName = 'GCE configured';

export const GCEWithImpersonation = () => (
  <StoryModeWrapper
    schema={schema}
    dsUid="gcm-gce-imp"
    dsName="Google Cloud Monitoring (GCE + Impersonation)"
    onSuccess={noop}
  />
);
GCEWithImpersonation.storyName = 'GCE with impersonation';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="gcm-ro" dsName="Google Cloud Monitoring (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
