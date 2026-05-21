import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import clickhouseSchemaJson from '../../../../schema/registry/grafana-clickhouse-datasource.schema.json';

const schema = clickhouseSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'ClickHouse',
  id: 1,
  uid: 'ch-fresh',
  type: 'grafana-clickhouse-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'ClickHouse Production',
  id: 2,
  uid: 'ch-full',
  type: 'grafana-clickhouse-datasource',
  url: '',
  jsonData: {
    host: 'clickhouse.cloud.example.com',
    port: 8443,
    protocol: 'http',
    secure: true,
    username: 'analytics',
    path: '/',
    defaultDatabase: 'production',
    defaultTable: 'events',
    dialTimeout: '15',
    queryTimeout: '120',
    connMaxLifetime: '10',
    maxIdleConns: '50',
    maxOpenConns: '100',
    validateSql: true,
    forwardGrafanaHeaders: true,
    enableRowLimit: true,
    httpHeaders: [
      { name: 'X-Custom-Org', value: 'my-org-id', secure: false },
      { name: 'Authorization', value: '', secure: true },
      { name: 'X-Trace-ID', value: 'debug-trace-123', secure: false },
      { name: 'X-API-Key', value: '', secure: true },
    ],
    logs: {
      defaultDatabase: 'logs_db',
      defaultTable: 'otel_logs',
      otelEnabled: true,
      otelVersion: 'latest',
    },
    traces: {
      defaultDatabase: 'traces_db',
      defaultTable: 'otel_traces',
      otelEnabled: true,
      otelVersion: 'latest',
    },
    aliasTables: [
      { targetDatabase: 'production', targetTable: 'events', aliasDatabase: '', aliasTable: 'event_aliases' },
    ],
    customSettings: [{ setting: 'max_block_size', value: '65505' }],
  },
  secureJsonFields: {
    password: true,
    tlsCACert: true,
    'secureHttpHeaders.Authorization': true,
    'secureHttpHeaders.X-API-Key': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'ch-full-ro',
  id: 3,
  name: 'ClickHouse Production (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'ch-fresh': fresh,
  'ch-full': fullyConfigured,
  'ch-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/ClickHouse',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="ch-fresh" dsName="ClickHouse" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="ch-full" dsName="ClickHouse Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="ch-full-ro" dsName="ClickHouse Production (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
