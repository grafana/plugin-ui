import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/config';
import { StoryModeWrapper } from './StoryModeWrapper';
import influxSchemaJson from './schemas/influxdb.schema.json';

const schema = influxSchemaJson as unknown as DatasourceConfigSchema;

const mockDatasources: Record<string, Record<string, unknown>> = {
  'influx-fresh': {
    name: 'influx-fresh',
    id: 1,
    uid: 'influx-fresh',
    type: 'influxdb',
    url: '',
    jsonData: {},
    secureJsonFields: {},
  },

  'influx-oss1-influxql': {
    name: 'influx-oss1-influxql',
    id: 2,
    uid: 'influx-oss1-influxql',
    type: 'influxdb',
    url: 'http://influxdb:8086',
    user: 'admin',
    jsonData: {
      product: 'InfluxDB OSS 1.x',
      version: 'InfluxQL',
      dbName: 'telegraf',
      httpMode: 'POST',
      timeInterval: '10s',
    },
    secureJsonFields: {
      password: true,
    },
  },

  'influx-oss2-flux': {
    name: 'influx-oss2-flux',
    id: 3,
    uid: 'influx-oss2-flux',
    type: 'influxdb',
    url: 'http://influxdb2:8086',
    jsonData: {
      product: 'InfluxDB OSS 2.x',
      version: 'Flux',
      organization: 'my-org',
      defaultBucket: 'my-bucket',
      timeInterval: '10s',
    },
    secureJsonFields: {
      token: true,
    },
  },

  'influx-cloud-sql': {
    name: 'influx-cloud-sql',
    id: 4,
    uid: 'influx-cloud-sql',
    type: 'influxdb',
    url: 'https://us-east-1-1.aws.cloud2.influxdata.com',
    jsonData: {
      product: 'InfluxDB Cloud Dedicated',
      version: 'SQL',
      dbName: 'production',
      timeInterval: '30s',
    },
    secureJsonFields: {
      token: true,
    },
  },

  'influx-basic-auth': {
    name: 'influx-basic-auth',
    id: 5,
    uid: 'influx-basic-auth',
    type: 'influxdb',
    url: 'https://influxdb.internal:8086',
    basicAuth: true,
    basicAuthUser: 'grafana',
    jsonData: {
      product: 'InfluxDB Enterprise 1.x',
      version: 'InfluxQL',
      dbName: 'metrics',
      httpMode: 'POST',
    },
    secureJsonFields: {
      basicAuthPassword: true,
    },
  },

  'influx-tls': {
    name: 'influx-tls',
    id: 6,
    uid: 'influx-tls',
    type: 'influxdb',
    url: 'https://influxdb.secure:8086',
    jsonData: {
      product: 'InfluxDB OSS 2.x',
      version: 'Flux',
      organization: 'secure-org',
      defaultBucket: 'secure-bucket',
      tlsAuth: true,
      tlsAuthWithCACert: true,
      serverName: 'influxdb.secure',
    },
    secureJsonFields: {
      token: true,
      tlsCACert: true,
      tlsClientCert: true,
      tlsClientKey: true,
    },
  },

  'influx-provisioned': {
    name: 'influx-provisioned',
    id: 7,
    uid: 'influx-provisioned',
    type: 'influxdb',
    url: 'http://influxdb.prod:8086',
    readOnly: true,
    jsonData: {
      product: 'InfluxDB OSS 1.x',
      version: 'InfluxQL',
      dbName: 'production',
      httpMode: 'POST',
      timeInterval: '15s',
    },
    secureJsonFields: {
      token: true,
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
  title: 'Editors/Config/InfluxDB',
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
  <DatasourceConfigWizard schema={schema} dsUid="influx-fresh" dsName="influx-fresh" onSuccess={noop} />
);
FreshNoConfig.storyName = 'Default';

export const Oss1InfluxQL = () => (
  <DatasourceConfigWizard schema={schema} dsUid="influx-oss1-influxql" dsName="influx-oss1-influxql" onSuccess={noop} />
);
Oss1InfluxQL.storyName = 'OSS 1.x (InfluxQL)';

export const Oss2Flux = () => (
  <DatasourceConfigWizard schema={schema} dsUid="influx-oss2-flux" dsName="influx-oss2-flux" onSuccess={noop} />
);
Oss2Flux.storyName = 'OSS 2.x (Flux)';

export const CloudDedicatedSql = () => (
  <DatasourceConfigWizard schema={schema} dsUid="influx-cloud-sql" dsName="influx-cloud-sql" onSuccess={noop} />
);
CloudDedicatedSql.storyName = 'Cloud Dedicated (SQL)';

export const BasicAuth = () => (
  <DatasourceConfigWizard schema={schema} dsUid="influx-basic-auth" dsName="influx-basic-auth" onSuccess={noop} />
);
BasicAuth.storyName = 'Enterprise with basic auth';

export const TlsAuth = () => (
  <DatasourceConfigWizard schema={schema} dsUid="influx-tls" dsName="influx-tls" onSuccess={noop} />
);
TlsAuth.storyName = 'TLS client auth';

export const Provisioned = () => (
  <DatasourceConfigWizard schema={schema} dsUid="influx-provisioned" dsName="influx-provisioned" onSuccess={noop} />
);
Provisioned.storyName = 'Read-only (provisioned)';
