import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import influxdbSchemaJson from '../../../../datasource/schema/datasources/influxdb.schema.json';

const schema = influxdbSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'InfluxDB',
  id: 1,
  uid: 'influxdb-fresh',
  type: 'influxdb',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

// --- v2 variants (with product field) ---

const v2Flux: Record<string, unknown> = {
  name: 'InfluxDB v2 Flux',
  id: 2,
  uid: 'influxdb-v2-flux',
  type: 'influxdb',
  url: 'http://influxdb:8181',
  basicAuth: true,
  basicAuthUser: 'user',
  jsonData: {
    product: 'InfluxDB OSS 2.x',
    version: 'Flux',
    organization: 'grafana',
    defaultBucket: 'grafanabucket',
    timeInterval: '10s',
    maxSeries: 1000,
    tlsSkipVerify: true,
  },
  secureJsonFields: {
    token: true,
    basicAuthPassword: true,
  },
};

const v2SQL: Record<string, unknown> = {
  name: 'InfluxDB v2 SQL',
  id: 3,
  uid: 'influxdb-v2-sql',
  type: 'influxdb',
  url: 'http://influxdb:8181',
  jsonData: {
    product: 'InfluxDB Cloud Dedicated',
    version: 'SQL',
    dbName: 'testdb',
    insecureGrpc: true,
    maxSeries: 1000,
  },
  secureJsonFields: {
    token: true,
  },
};

const v2InfluxQL: Record<string, unknown> = {
  name: 'InfluxDB v2 InfluxQL',
  id: 4,
  uid: 'influxdb-v2-influxql',
  type: 'influxdb',
  url: 'http://influxdb:8181',
  user: 'admin',
  jsonData: {
    product: 'InfluxDB OSS 1.x',
    version: 'InfluxQL',
    dbName: 'testdb',
    httpMode: 'POST',
    timeInterval: '10s',
    showTagTime: '12h',
    maxSeries: 1000,
    tlsSkipVerify: true,
  },
  secureJsonFields: {
    password: true,
  },
};

// --- v1 variants (no product field, backward compat) ---

const v1InfluxQL: Record<string, unknown> = {
  name: 'InfluxDB v1 InfluxQL',
  id: 5,
  uid: 'influxdb-v1-influxql',
  type: 'influxdb',
  url: 'http://influxdb:8181',
  user: 'admin',
  jsonData: {
    version: 'InfluxQL',
    dbName: 'testdb',
    httpMode: 'POST',
    timeInterval: '10s',
    showTagTime: '12h',
    maxSeries: 1000,
  },
  secureJsonFields: {
    password: true,
  },
};

const v1Flux: Record<string, unknown> = {
  name: 'InfluxDB v1 Flux',
  id: 6,
  uid: 'influxdb-v1-flux',
  type: 'influxdb',
  url: 'http://influxdb:8181',
  basicAuth: true,
  basicAuthUser: 'user',
  jsonData: {
    version: 'Flux',
    organization: 'grafana',
    defaultBucket: 'mybucket',
    timeInterval: '10s',
    maxSeries: 1000,
  },
  secureJsonFields: {
    token: true,
    basicAuthPassword: true,
  },
};

const basicAuth: Record<string, unknown> = {
  name: 'InfluxDB (Basic Auth)',
  id: 7,
  uid: 'influxdb-basic-auth',
  type: 'influxdb',
  url: 'http://influxdb:8181',
  basicAuth: true,
  basicAuthUser: 'User',
  jsonData: {
    product: 'InfluxDB OSS 2.x',
    version: 'Flux',
    organization: 'grafana',
    defaultBucket: 'default bucket',
    timeInterval: '10s',
    maxSeries: 1000,
    tlsSkipVerify: true,
  },
  secureJsonFields: {
    token: true,
    basicAuthPassword: true,
  },
};

const readOnly: Record<string, unknown> = {
  ...v2Flux,
  uid: 'influxdb-ro',
  id: 8,
  name: 'InfluxDB (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'influxdb-fresh': fresh,
  'influxdb-v2-flux': v2Flux,
  'influxdb-v2-sql': v2SQL,
  'influxdb-v2-influxql': v2InfluxQL,
  'influxdb-v1-influxql': v1InfluxQL,
  'influxdb-v1-flux': v1Flux,
  'influxdb-basic-auth': basicAuth,
  'influxdb-ro': readOnly,
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
  title: 'Editors/Config/InfluxDB',
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
  <StoryModeWrapper schema={schema} dsUid="influxdb-fresh" dsName="InfluxDB" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const V2Flux = () => (
  <StoryModeWrapper schema={schema} dsUid="influxdb-v2-flux" dsName="InfluxDB v2 Flux" onSuccess={noop} />
);
V2Flux.storyName = 'v2 — Flux';

export const V2SQL = () => (
  <StoryModeWrapper schema={schema} dsUid="influxdb-v2-sql" dsName="InfluxDB v2 SQL" onSuccess={noop} />
);
V2SQL.storyName = 'v2 — SQL';

export const V2InfluxQL = () => (
  <StoryModeWrapper schema={schema} dsUid="influxdb-v2-influxql" dsName="InfluxDB v2 InfluxQL" onSuccess={noop} />
);
V2InfluxQL.storyName = 'v2 — InfluxQL';

export const V1InfluxQL = () => (
  <StoryModeWrapper schema={schema} dsUid="influxdb-v1-influxql" dsName="InfluxDB v1 InfluxQL" onSuccess={noop} />
);
V1InfluxQL.storyName = 'v1 compat — InfluxQL';

export const V1Flux = () => (
  <StoryModeWrapper schema={schema} dsUid="influxdb-v1-flux" dsName="InfluxDB v1 Flux" onSuccess={noop} />
);
V1Flux.storyName = 'v1 compat — Flux';

export const BasicAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="influxdb-basic-auth" dsName="InfluxDB (Basic Auth)" onSuccess={noop} />
);
BasicAuth.storyName = 'Basic Auth';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="influxdb-ro" dsName="InfluxDB (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
