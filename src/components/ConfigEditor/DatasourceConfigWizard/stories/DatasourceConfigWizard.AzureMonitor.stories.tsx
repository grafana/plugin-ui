import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/grafana-azure-monitor-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Azure Monitor',
  id: 1,
  uid: 'azmon-fresh',
  type: 'grafana-azure-monitor-datasource',
  url: '',
  jsonData: {
    azureAuthType: 'clientsecret',
    cloudName: 'azuremonitor',
  },
  secureJsonFields: {},
};

const clientSecretConfigured: Record<string, unknown> = {
  name: 'Azure Monitor (Client Secret)',
  id: 2,
  uid: 'azmon-cs',
  type: 'grafana-azure-monitor-datasource',
  url: '',
  jsonData: {
    azureAuthType: 'clientsecret',
    cloudName: 'azuremonitor',
    tenantId: '11111111-1111-1111-1111-111111111111',
    clientId: '22222222-2222-2222-2222-222222222222',
    subscriptionId: '33333333-3333-3333-3333-333333333333',
    basicLogsEnabled: false,
  },
  secureJsonFields: {
    azureClientSecret: true,
  },
};

const clientCertConfigured: Record<string, unknown> = {
  name: 'Azure Monitor (Client Certificate)',
  id: 3,
  uid: 'azmon-cert',
  type: 'grafana-azure-monitor-datasource',
  url: '',
  jsonData: {
    azureAuthType: 'clientcertificate',
    cloudName: 'azuremonitor',
    tenantId: '11111111-1111-1111-1111-111111111111',
    clientId: '22222222-2222-2222-2222-222222222222',
    subscriptionId: '33333333-3333-3333-3333-333333333333',
    azureCredentials: {
      certificateFormat: 'pem',
    },
  },
  secureJsonFields: {
    clientCertificate: true,
    privateKey: true,
  },
};

const managedIdentity: Record<string, unknown> = {
  name: 'Azure Monitor (Managed Identity)',
  id: 4,
  uid: 'azmon-msi',
  type: 'grafana-azure-monitor-datasource',
  url: '',
  jsonData: {
    azureAuthType: 'msi',
    subscriptionId: '33333333-3333-3333-3333-333333333333',
  },
  secureJsonFields: {},
};

const workloadIdentity: Record<string, unknown> = {
  name: 'Azure Monitor (Workload Identity)',
  id: 5,
  uid: 'azmon-wli',
  type: 'grafana-azure-monitor-datasource',
  url: '',
  jsonData: {
    azureAuthType: 'workloadidentity',
    subscriptionId: '33333333-3333-3333-3333-333333333333',
  },
  secureJsonFields: {},
};

const readOnly: Record<string, unknown> = {
  ...clientSecretConfigured,
  uid: 'azmon-ro',
  id: 6,
  name: 'Azure Monitor (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'azmon-fresh': fresh,
  'azmon-cs': clientSecretConfigured,
  'azmon-cert': clientCertConfigured,
  'azmon-msi': managedIdentity,
  'azmon-wli': workloadIdentity,
  'azmon-ro': readOnly,
};

// ============================================================
// Backend mock
// ============================================================

function mockBackendSrv() {
  setBackendSrv({
    get: (url: string) => {
      const uid = url.replace('/api/datasources/uid/', '');
      const ds = mocks[uid];
      return ds ? Promise.resolve(ds) : Promise.reject(new Error(`Datasource ${uid} not found`));
    },
    put: () => Promise.resolve({}),
  } as unknown as BackendSrv);
}

// ============================================================
// Stories
// ============================================================

export default {
  title: 'Editors/Config/AzureMonitor',
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
  <StoryModeWrapper schema={schema} dsUid="azmon-fresh" dsName="Azure Monitor" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const ClientSecret = () => (
  <StoryModeWrapper schema={schema} dsUid="azmon-cs" dsName="Azure Monitor (Client Secret)" onSuccess={noop} />
);
ClientSecret.storyName = 'App Registration (Client Secret)';

export const ClientCertificate = () => (
  <StoryModeWrapper schema={schema} dsUid="azmon-cert" dsName="Azure Monitor (Client Certificate)" onSuccess={noop} />
);
ClientCertificate.storyName = 'App Registration (Client Certificate)';

export const ManagedIdentity = () => (
  <StoryModeWrapper schema={schema} dsUid="azmon-msi" dsName="Azure Monitor (Managed Identity)" onSuccess={noop} />
);
ManagedIdentity.storyName = 'Managed Identity';

export const WorkloadIdentity = () => (
  <StoryModeWrapper schema={schema} dsUid="azmon-wli" dsName="Azure Monitor (Workload Identity)" onSuccess={noop} />
);
WorkloadIdentity.storyName = 'Workload Identity';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="azmon-ro" dsName="Azure Monitor (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
