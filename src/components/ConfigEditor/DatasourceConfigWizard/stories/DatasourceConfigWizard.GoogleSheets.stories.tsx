import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import googleSheetsSchemaJson from '../../../../schema/registry/grafana-googlesheets-datasource.schema.json';

const schema = googleSheetsSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Google Sheets',
  id: 20,
  uid: 'gs-fresh',
  type: 'grafana-googlesheets-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const jwtConfigured: Record<string, unknown> = {
  name: 'Google Sheets (JWT — private key)',
  id: 21,
  uid: 'gs-jwt',
  type: 'grafana-googlesheets-datasource',
  url: '',
  jsonData: {
    authenticationType: 'jwt',
    defaultProject: 'my-gcp-project-123',
    clientEmail: 'sheets-reader@my-gcp-project-123.iam.gserviceaccount.com',
    tokenUri: 'https://oauth2.googleapis.com/token',
    defaultSheetID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
  },
  secureJsonFields: {
    privateKey: true,
  },
};

const jwtKeyPathConfigured: Record<string, unknown> = {
  name: 'Google Sheets (JWT — key path)',
  id: 25,
  uid: 'gs-jwt-path',
  type: 'grafana-googlesheets-datasource',
  url: '',
  jsonData: {
    authenticationType: 'jwt',
    defaultProject: 'my-gcp-project-123',
    clientEmail: 'sheets-reader@my-gcp-project-123.iam.gserviceaccount.com',
    tokenUri: 'https://oauth2.googleapis.com/token',
    privateKeyPath: '/etc/secrets/gce.pem',
    defaultSheetID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
  },
  secureJsonFields: {},
};

const apiKeyConfigured: Record<string, unknown> = {
  name: 'Google Sheets (API Key)',
  id: 22,
  uid: 'gs-apikey',
  type: 'grafana-googlesheets-datasource',
  url: '',
  jsonData: {
    authenticationType: 'key',
    defaultSheetID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
  },
  secureJsonFields: {
    apiKey: true,
  },
};

const gceConfigured: Record<string, unknown> = {
  name: 'Google Sheets (GCE)',
  id: 23,
  uid: 'gs-gce',
  type: 'grafana-googlesheets-datasource',
  url: '',
  jsonData: {
    authenticationType: 'gce',
    defaultProject: 'my-gce-project',
    defaultSheetID: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms',
  },
  secureJsonFields: {},
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...jwtConfigured,
  uid: 'gs-ro',
  id: 24,
  name: 'Google Sheets (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'gs-fresh': fresh,
  'gs-jwt': jwtConfigured,
  'gs-jwt-path': jwtKeyPathConfigured,
  'gs-apikey': apiKeyConfigured,
  'gs-gce': gceConfigured,
  'gs-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Google Sheets',
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
  <StoryModeWrapper schema={schema} dsUid="gs-fresh" dsName="Google Sheets" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const JWTConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="gs-jwt" dsName="Google Sheets (JWT — private key)" onSuccess={noop} />
);
JWTConfigured.storyName = 'JWT configured (private key)';

export const JWTKeyPathConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="gs-jwt-path" dsName="Google Sheets (JWT — key path)" onSuccess={noop} />
);
JWTKeyPathConfigured.storyName = 'JWT configured (key path)';

export const APIKeyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="gs-apikey" dsName="Google Sheets (API Key)" onSuccess={noop} />
);
APIKeyConfigured.storyName = 'API Key configured';

export const GCEConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="gs-gce" dsName="Google Sheets (GCE)" onSuccess={noop} />
);
GCEConfigured.storyName = 'GCE configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="gs-ro" dsName="Google Sheets (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
