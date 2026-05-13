import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/config';
import { StoryModeWrapper } from './StoryModeWrapper';
import postgresSchemaJson from './schemas/postgresql.schema.json';

const schema = postgresSchemaJson as unknown as DatasourceConfigSchema;

const mockDatasources: Record<string, Record<string, unknown>> = {
  'pg-fresh': {
    name: 'pg-fresh',
    id: 1,
    uid: 'pg-fresh',
    type: 'grafana-postgresql-datasource',
    url: '',
    jsonData: {},
    secureJsonFields: {},
  },

  'pg-basic': {
    name: 'pg-basic',
    id: 2,
    uid: 'pg-basic',
    type: 'grafana-postgresql-datasource',
    url: 'localhost:5432',
    user: 'grafana',
    jsonData: {
      database: 'grafana',
      sslmode: 'disable',
    },
    database: 'grafana',
    secureJsonFields: {
      password: true,
    },
  },

  'pg-ssl-require': {
    name: 'pg-ssl-require',
    id: 3,
    uid: 'pg-ssl-require',
    type: 'grafana-postgresql-datasource',
    url: 'postgres.cloud.example.com:5432',
    user: 'admin',
    jsonData: {
      database: 'production',
      sslmode: 'require',
    },
    database: 'production',
    secureJsonFields: {
      password: true,
    },
  },

  'pg-ssl-verify': {
    name: 'pg-ssl-verify',
    id: 4,
    uid: 'pg-ssl-verify',
    type: 'grafana-postgresql-datasource',
    url: 'postgres.secure.example.com:5432',
    user: 'readonly',
    jsonData: {
      database: 'analytics',
      sslmode: 'verify-full',
      tlsConfigurationMethod: 'file-content',
      servername: 'postgres.secure.example.com',
    },
    database: 'analytics',
    secureJsonFields: {
      password: true,
      tlsCACert: true,
      tlsClientCert: true,
      tlsClientKey: true,
    },
  },

  'pg-timescale': {
    name: 'pg-timescale',
    id: 5,
    uid: 'pg-timescale',
    type: 'grafana-postgresql-datasource',
    url: 'timescale.internal:5432',
    user: 'grafana',
    jsonData: {
      database: 'metrics',
      sslmode: 'disable',
      timescaledb: true,
      timeInterval: '10s',
      postgresVersion: 1500,
      maxOpenConns: 100,
      maxIdleConns: 10,
      connMaxLifetime: 14400,
    },
    database: 'metrics',
    secureJsonFields: {
      password: true,
    },
  },

  'pg-provisioned': {
    name: 'pg-provisioned',
    id: 6,
    uid: 'pg-provisioned',
    type: 'grafana-postgresql-datasource',
    url: 'postgres.prod:5432',
    user: 'grafana_ro',
    readOnly: true,
    jsonData: {
      database: 'production',
      sslmode: 'require',
    },
    database: 'production',
    secureJsonFields: {
      password: true,
    },
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
  title: 'Editors/Config/PostgreSQL',
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
  <DatasourceConfigWizard schema={schema} dsUid="pg-fresh" dsName="pg-fresh" onSuccess={noop} />
);
FreshNoConfig.storyName = 'Default';

export const BasicConnection = () => (
  <DatasourceConfigWizard schema={schema} dsUid="pg-basic" dsName="pg-basic" onSuccess={noop} />
);
BasicConnection.storyName = 'Basic connection';

export const SslRequired = () => (
  <DatasourceConfigWizard schema={schema} dsUid="pg-ssl-require" dsName="pg-ssl-require" onSuccess={noop} />
);
SslRequired.storyName = 'SSL required';

export const SslVerifyFull = () => (
  <DatasourceConfigWizard schema={schema} dsUid="pg-ssl-verify" dsName="pg-ssl-verify" onSuccess={noop} />
);
SslVerifyFull.storyName = 'SSL verify-full with certs';

export const TimescaleDb = () => (
  <DatasourceConfigWizard schema={schema} dsUid="pg-timescale" dsName="pg-timescale" onSuccess={noop} />
);
TimescaleDb.storyName = 'TimescaleDB with connection limits';

export const Provisioned = () => (
  <DatasourceConfigWizard schema={schema} dsUid="pg-provisioned" dsName="pg-provisioned" onSuccess={noop} />
);
Provisioned.storyName = 'Read-only (provisioned)';
