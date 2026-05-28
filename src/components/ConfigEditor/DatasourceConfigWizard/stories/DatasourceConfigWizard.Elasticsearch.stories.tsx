import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/elasticsearch.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Elasticsearch',
  id: 1,
  uid: 'es-fresh',
  type: 'elasticsearch',
  url: '',
  jsonData: {
    timeField: '@timestamp',
    maxConcurrentShardRequests: 5,
  },
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Elasticsearch Production',
  id: 2,
  uid: 'es-full',
  type: 'elasticsearch',
  url: 'http://elasticsearch:9200',
  jsonData: {
    index: 'logs-*',
    timeField: '@timestamp',
    interval: 'Daily',
    timeInterval: '10s',
    maxConcurrentShardRequests: 5,
    logMessageField: 'message',
    logLevelField: 'level',
    includeFrozen: false,
    defaultQueryMode: 'metrics',
  },
  secureJsonFields: {},
};

const apiKeyAuth: Record<string, unknown> = {
  name: 'Elasticsearch (API Key)',
  id: 3,
  uid: 'es-apikey',
  type: 'elasticsearch',
  url: 'http://elasticsearch:9200',
  jsonData: {
    index: 'metrics-*',
    timeField: '@timestamp',
    maxConcurrentShardRequests: 5,
    apiKeyAuth: true,
  },
  secureJsonFields: {
    apiKey: true,
  },
};

const sigV4Auth: Record<string, unknown> = {
  name: 'Elasticsearch (SigV4)',
  id: 4,
  uid: 'es-sigv4',
  type: 'elasticsearch',
  url: 'https://search-my-domain.us-east-1.es.amazonaws.com',
  jsonData: {
    index: 'logs-*',
    timeField: '@timestamp',
    maxConcurrentShardRequests: 5,
    sigV4Auth: true,
  },
  secureJsonFields: {},
};

const withDataLinks: Record<string, unknown> = {
  name: 'Elasticsearch (Data Links)',
  id: 5,
  uid: 'es-links',
  type: 'elasticsearch',
  url: 'http://elasticsearch:9200',
  jsonData: {
    index: 'traces-*',
    timeField: '@timestamp',
    maxConcurrentShardRequests: 5,
    logMessageField: 'message',
    logLevelField: 'severity',
    dataLinks: [{ field: 'traceId', url: '', urlDisplayLabel: 'View Trace', datasourceUid: 'tempo-uid' }],
  },
  secureJsonFields: {},
};

const readOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'es-full-ro',
  id: 6,
  name: 'Elasticsearch (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'es-fresh': fresh,
  'es-full': fullyConfigured,
  'es-apikey': apiKeyAuth,
  'es-sigv4': sigV4Auth,
  'es-links': withDataLinks,
  'es-full-ro': readOnly,
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
  title: 'Editors/Config/Elasticsearch',
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
  <StoryModeWrapper schema={schema} dsUid="es-fresh" dsName="Elasticsearch" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="es-full" dsName="Elasticsearch Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ApiKeyAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="es-apikey" dsName="Elasticsearch (API Key)" onSuccess={noop} />
);
ApiKeyAuth.storyName = 'API Key authentication';

export const SigV4Auth = () => (
  <StoryModeWrapper schema={schema} dsUid="es-sigv4" dsName="Elasticsearch (SigV4)" onSuccess={noop} />
);
SigV4Auth.storyName = 'SigV4 authentication';

export const WithDataLinks = () => (
  <StoryModeWrapper schema={schema} dsUid="es-links" dsName="Elasticsearch (Data Links)" onSuccess={noop} />
);
WithDataLinks.storyName = 'With data links';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="es-full-ro" dsName="Elasticsearch (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
