import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import { Button } from '@grafana/ui';
import { DatasourceConfigWizard } from '../DatasourceConfigWizard';
import type { DatasourceConfigSchema } from '../../../datasource/schema/config';
import prometheusSchemaJson from './schemas/prometheus.schema.json';

const schema = prometheusSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Simulated datasource API responses per UID
// ============================================================

const mockDatasources: Record<string, Record<string, unknown>> = {
  // Fresh — no existing config
  'prom-fresh': {
    name: 'prom-fresh',
    id: 1,
    uid: 'prom-fresh',
    type: 'prometheus',
    url: '',
    jsonData: {},
    secureJsonFields: {},
  },

  // No auth — URL configured, default settings
  'prom-no-auth': {
    name: 'prom-no-auth',
    id: 2,
    uid: 'prom-no-auth',
    type: 'prometheus',
    url: 'http://prometheus:9090',
    jsonData: {
      httpMethod: 'POST',
      timeInterval: '15s',
    },
    secureJsonFields: {},
  },

  // Basic auth configured
  'prom-basic-auth': {
    name: 'prom-basic-auth',
    id: 3,
    uid: 'prom-basic-auth',
    type: 'prometheus',
    url: 'https://prometheus.internal:9090',
    basicAuth: true,
    basicAuthUser: 'admin',
    jsonData: {
      httpMethod: 'POST',
      timeInterval: '15s',
    },
    secureJsonFields: {
      basicAuthPassword: true,
    },
  },

  // OAuth forward identity
  'prom-oauth': {
    name: 'prom-oauth',
    id: 4,
    uid: 'prom-oauth',
    type: 'prometheus',
    url: 'https://prometheus.cloud:443',
    jsonData: {
      oauthPassThru: true,
      httpMethod: 'POST',
      timeInterval: '15s',
    },
    secureJsonFields: {},
  },

  // TLS with CA certificate
  'prom-tls-ca': {
    name: 'prom-tls-ca',
    id: 5,
    uid: 'prom-tls-ca',
    type: 'prometheus',
    url: 'https://prometheus.secure:9090',
    jsonData: {
      tlsAuthWithCACert: true,
      httpMethod: 'POST',
    },
    secureJsonFields: {
      tlsCACert: true,
    },
  },

  // TLS with client cert + key (mTLS)
  'prom-mtls': {
    name: 'prom-mtls',
    id: 6,
    uid: 'prom-mtls',
    type: 'prometheus',
    url: 'https://prometheus.mtls:9090',
    jsonData: {
      tlsAuthWithCACert: true,
      tlsAuth: true,
      serverName: 'prometheus.mtls',
      httpMethod: 'POST',
    },
    secureJsonFields: {
      tlsCACert: true,
      tlsClientCert: true,
      tlsClientKey: true,
    },
  },

  // Custom HTTP headers (Authorization bearer token)
  'prom-bearer': {
    name: 'prom-bearer',
    id: 7,
    uid: 'prom-bearer',
    type: 'prometheus',
    url: 'https://cortex.grafana.net/api/prom',
    jsonData: {
      httpHeaderName1: 'Authorization',
      httpMethod: 'POST',
      timeInterval: '60s',
    },
    secureJsonFields: {
      httpHeaderValue1: true,
    },
  },

  // Fully configured — all settings tuned
  'prom-full': {
    name: 'prom-full',
    id: 8,
    uid: 'prom-full',
    type: 'prometheus',
    url: 'https://mimir.grafana.net/api/prom',
    basicAuth: true,
    basicAuthUser: 'tenant-1',
    jsonData: {
      httpMethod: 'POST',
      timeInterval: '30s',
      queryTimeout: '120s',
      manageAlerts: true,
      prometheusType: 'Mimir',
      cacheLevel: 'High',
      incrementalQuerying: true,
      incrementalQueryOverlapWindow: '10m',
      defaultEditor: 'code',
      disableMetricsLookup: false,
      httpHeaderName1: 'X-Scope-OrgID',
      timeout: 60,
      keepCookies: ['grafana_session'],
    },
    secureJsonFields: {
      basicAuthPassword: true,
      httpHeaderValue1: true,
    },
  },

  // Read-only (provisioned)
  'prom-provisioned': {
    name: 'prom-provisioned',
    id: 9,
    uid: 'prom-provisioned',
    type: 'prometheus',
    url: 'http://prometheus:9090',
    readOnly: true,
    jsonData: {
      httpMethod: 'POST',
      timeInterval: '15s',
      manageAlerts: true,
    },
    secureJsonFields: {},
  },
};

function mockBackendSrv(mocks: Record<string, Record<string, unknown>>) {
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

export default {
  title: 'Editors/Config/Prometheus',
  component: DatasourceConfigWizard,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv(mockDatasources);
      return <Story />;
    },
  ],
};

const noop = () => {};

export const FreshNoConfig = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-fresh" dsName="prom-fresh" onSuccess={noop} />
);
FreshNoConfig.storyName = 'Default';

export const NoAuth = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-no-auth" dsName="prom-no-auth" onSuccess={noop} />
);
NoAuth.storyName = 'No auth';

export const BasicAuth = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-basic-auth" dsName="prom-basic-auth" onSuccess={noop} />
);
BasicAuth.storyName = 'Basic auth';

export const OAuthForward = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-oauth" dsName="prom-oauth" onSuccess={noop} />
);
OAuthForward.storyName = 'OAuth forward identity';

export const TlsCaCert = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-tls-ca" dsName="prom-tls-ca" onSuccess={noop} />
);
TlsCaCert.storyName = 'TLS with CA cert';

export const MutualTls = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-mtls" dsName="prom-mtls" onSuccess={noop} />
);
MutualTls.storyName = 'Mutual TLS (mTLS)';

export const BearerToken = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-bearer" dsName="prom-bearer" onSuccess={noop} />
);
BearerToken.storyName = 'Bearer token via headers';

export const FullyConfigured = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-full" dsName="prom-full" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured (Mimir)';

export const Provisioned = () => (
  <DatasourceConfigWizard schema={schema} dsUid="prom-provisioned" dsName="prom-provisioned" onSuccess={noop} />
);
Provisioned.storyName = 'Read-only (provisioned)';

export const HealthError = () => (
  <DatasourceConfigWizard
    schema={schema}
    dsUid="prom-no-auth"
    dsName="prom-no-auth"
    onSuccess={noop}
    healthError='parse "": empty url - There was an error returned querying the Prometheus API.'
    renderActions={({ dsName, healthError }) => (
      <Button
        variant="secondary"
        size="sm"
        icon="exclamation-triangle"
        tooltip={healthError}
        onClick={() => alert(`Analyze ${dsName}: ${healthError}`)}
      >
        Analyze with Assistant
      </Button>
    )}
  />
);
HealthError.storyName = 'Health check error';
