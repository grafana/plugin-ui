import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import postgresSchemaJson from '../../../../datasource/schema/datasources/grafana-postgresql-datasource.schema.json';

const schema = postgresSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'PostgreSQL',
  id: 1,
  uid: 'pg-fresh',
  type: 'grafana-postgresql-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'PostgreSQL Production',
  id: 2,
  uid: 'pg-full',
  type: 'grafana-postgresql-datasource',
  url: 'postgres-prod:5432',
  user: 'grafana',
  jsonData: {
    database: 'grafana_production',
    sslmode: 'disable',
    postgresVersion: 1200,
    timescaledb: false,
    timeInterval: '1m',
    maxOpenConns: 100,
    connMaxLifetime: 14400,
  },
  secureJsonFields: {
    password: true,
  },
};

const tlsFilePath: Record<string, unknown> = {
  name: 'PostgreSQL TLS (file path)',
  id: 3,
  uid: 'pg-tls-fp',
  type: 'grafana-postgresql-datasource',
  url: 'postgres-tls:5432',
  user: 'grafana',
  jsonData: {
    database: 'grafana_secure',
    sslmode: 'verify-full',
    tlsConfigurationMethod: 'file-path',
    sslRootCertFile: '/etc/ssl/certs/pg-root.crt',
    sslCertFile: '/etc/ssl/certs/pg-client.crt',
    sslKeyFile: '/etc/ssl/private/pg-client.key',
    postgresVersion: 1500,
    timescaledb: false,
    timeInterval: '1m',
    maxOpenConns: 100,
    connMaxLifetime: 14400,
  },
  secureJsonFields: {
    password: true,
  },
};

const tlsCertContent: Record<string, unknown> = {
  name: 'PostgreSQL TLS (certificate content)',
  id: 4,
  uid: 'pg-tls-cc',
  type: 'grafana-postgresql-datasource',
  url: 'postgres-tls:5432',
  user: 'grafana',
  jsonData: {
    database: 'grafana_secure',
    sslmode: 'verify-full',
    tlsConfigurationMethod: 'file-content',
    postgresVersion: 1500,
    timescaledb: false,
    timeInterval: '1m',
    maxOpenConns: 100,
    connMaxLifetime: 14400,
  },
  secureJsonFields: {
    password: true,
    tlsCACert: true,
    tlsClientCert: true,
    tlsClientKey: true,
  },
};

const timescaleDB: Record<string, unknown> = {
  name: 'PostgreSQL + TimescaleDB',
  id: 5,
  uid: 'pg-tsdb',
  type: 'grafana-postgresql-datasource',
  url: 'timescale-prod:5432',
  user: 'grafana',
  jsonData: {
    database: 'metrics',
    sslmode: 'require',
    postgresVersion: 1500,
    timescaledb: true,
    timeInterval: '10s',
    maxOpenConns: 200,
    connMaxLifetime: 7200,
  },
  secureJsonFields: {
    password: true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'pg-full-ro',
  id: 6,
  name: 'PostgreSQL Production (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'pg-fresh': fresh,
  'pg-full': fullyConfigured,
  'pg-tls-fp': tlsFilePath,
  'pg-tls-cc': tlsCertContent,
  'pg-tsdb': timescaleDB,
  'pg-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/PostgreSQL',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="pg-fresh" dsName="PostgreSQL" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="pg-full" dsName="PostgreSQL Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured (TLS disabled)';

export const TLSFilePath = () => (
  <StoryModeWrapper schema={schema} dsUid="pg-tls-fp" dsName="PostgreSQL TLS (file path)" onSuccess={noop} />
);
TLSFilePath.storyName = 'TLS verify-full (file path)';

export const TLSCertContent = () => (
  <StoryModeWrapper schema={schema} dsUid="pg-tls-cc" dsName="PostgreSQL TLS (certificate content)" onSuccess={noop} />
);
TLSCertContent.storyName = 'TLS verify-full (certificate content)';

export const TimescaleDB = () => (
  <StoryModeWrapper schema={schema} dsUid="pg-tsdb" dsName="PostgreSQL + TimescaleDB" onSuccess={noop} />
);
TimescaleDB.storyName = 'TimescaleDB enabled';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="pg-full-ro" dsName="PostgreSQL Production (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
