import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import bigQuerySchemaJson from '../../../../schema/registry/grafana-bigquery-datasource.schema.json';

const schema = bigQuerySchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Google BigQuery',
  id: 30,
  uid: 'bq-fresh',
  type: 'grafana-bigquery-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const jwtConfigured: Record<string, unknown> = {
  name: 'Google BigQuery (JWT — private key)',
  id: 31,
  uid: 'bq-jwt',
  type: 'grafana-bigquery-datasource',
  url: '',
  jsonData: {
    authenticationType: 'jwt',
    defaultProject: 'explore-sequel-void',
    clientEmail: 'test-service-account@explore-sequel-void.iam.gserviceaccount.com',
    tokenUri: 'https://oauth2.googleapis.com/token',
    processingLocation: 'US',
  },
  secureJsonFields: {
    privateKey: true,
  },
};

const jwtKeyPathConfigured: Record<string, unknown> = {
  name: 'Google BigQuery (JWT — key path)',
  id: 32,
  uid: 'bq-jwt-path',
  type: 'grafana-bigquery-datasource',
  url: '',
  jsonData: {
    authenticationType: 'jwt',
    defaultProject: 'explore-sequel-void',
    clientEmail: 'test-service-account@explore-sequel-void.iam.gserviceaccount.com',
    tokenUri: 'https://oauth2.googleapis.com/token',
    privateKeyPath: '/etc/secrets/bigquery.pem',
    processingLocation: 'US',
  },
  secureJsonFields: {},
};

const gceConfigured: Record<string, unknown> = {
  name: 'Google BigQuery (GCE)',
  id: 33,
  uid: 'bq-gce',
  type: 'grafana-bigquery-datasource',
  url: '',
  jsonData: {
    authenticationType: 'gce',
    defaultProject: 'explore-sequel-void',
  },
  secureJsonFields: {},
};

const gceWithImpersonation: Record<string, unknown> = {
  name: 'Google BigQuery (GCE + Impersonation)',
  id: 34,
  uid: 'bq-gce-imp',
  type: 'grafana-bigquery-datasource',
  url: '',
  jsonData: {
    authenticationType: 'gce',
    defaultProject: 'explore-sequel-void',
    usingImpersonation: true,
    serviceAccountToImpersonate: 'impersonated@explore-sequel-void.iam.gserviceaccount.com',
  },
  secureJsonFields: {},
};

const forwardOAuth: Record<string, unknown> = {
  name: 'Google BigQuery (Forward OAuth)',
  id: 35,
  uid: 'bq-oauth',
  type: 'grafana-bigquery-datasource',
  url: '',
  jsonData: {
    authenticationType: 'forwardOAuthIdentity',
    defaultProject: 'explore-sequel-void',
    oauthPassThru: true,
  },
  secureJsonFields: {},
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...jwtConfigured,
  uid: 'bq-ro',
  id: 36,
  name: 'Google BigQuery (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'bq-fresh': fresh,
  'bq-jwt': jwtConfigured,
  'bq-jwt-path': jwtKeyPathConfigured,
  'bq-gce': gceConfigured,
  'bq-gce-imp': gceWithImpersonation,
  'bq-oauth': forwardOAuth,
  'bq-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Google BigQuery',
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
  <StoryModeWrapper schema={schema} dsUid="bq-fresh" dsName="Google BigQuery" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const JWTConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="bq-jwt" dsName="Google BigQuery (JWT — private key)" onSuccess={noop} />
);
JWTConfigured.storyName = 'JWT configured (private key)';

export const JWTKeyPathConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="bq-jwt-path" dsName="Google BigQuery (JWT — key path)" onSuccess={noop} />
);
JWTKeyPathConfigured.storyName = 'JWT configured (key path)';

export const GCEConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="bq-gce" dsName="Google BigQuery (GCE)" onSuccess={noop} />
);
GCEConfigured.storyName = 'GCE configured';

export const GCEWithImpersonation = () => (
  <StoryModeWrapper
    schema={schema}
    dsUid="bq-gce-imp"
    dsName="Google BigQuery (GCE + Impersonation)"
    onSuccess={noop}
  />
);
GCEWithImpersonation.storyName = 'GCE with impersonation';

export const ForwardOAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="bq-oauth" dsName="Google BigQuery (Forward OAuth)" onSuccess={noop} />
);
ForwardOAuth.storyName = 'Forward OAuth Identity';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="bq-ro" dsName="Google BigQuery (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
