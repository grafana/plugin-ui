import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import tempoSchemaJson from '../../../../datasource/schema/datasources/tempo.schema.json';

const schema = tempoSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Tempo',
  id: 1,
  uid: 'tempo-fresh',
  type: 'tempo',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Tempo Production',
  id: 2,
  uid: 'tempo-full',
  type: 'tempo',
  url: 'http://tempo:3200',
  basicAuth: false,
  jsonData: {
    nodeGraph: {
      enabled: true,
    },
    streamingEnabled: {
      search: true,
      metrics: true,
    },
    serviceMap: {
      datasourceUid: 'prom-uid',
    },
    traceQuery: {
      timeShiftEnabled: true,
      spanStartTimeShift: '30m',
      spanEndTimeShift: '30m',
    },
    timeRangeForTags: 1800,
    tagLimit: 100,
  },
  secureJsonFields: {},
};

const tracingLinks: Record<string, unknown> = {
  name: 'Tempo Tracing Links',
  id: 3,
  uid: 'tempo-tracing',
  type: 'tempo',
  url: 'http://tempo:3200',
  jsonData: {
    nodeGraph: {
      enabled: true,
    },
    tracesToLogsV2: {
      datasourceUid: 'loki-uid',
      spanStartTimeShift: '-1h',
      spanEndTimeShift: '1h',
      filterByTraceID: true,
      filterBySpanID: true,
    },
    tracesToMetrics: {
      datasourceUid: 'prom-uid',
      spanStartTimeShift: '-1h',
      spanEndTimeShift: '1h',
    },
    tracesToProfiles: {
      datasourceUid: 'pyroscope-uid',
    },
    serviceMap: {
      datasourceUid: 'prom-uid',
    },
  },
  secureJsonFields: {},
};

const basicAuth: Record<string, unknown> = {
  name: 'Tempo Basic Auth',
  id: 4,
  uid: 'tempo-basic-auth',
  type: 'tempo',
  url: 'http://tempo:3200',
  basicAuth: true,
  basicAuthUser: 'tempo-user',
  jsonData: {
    nodeGraph: {
      enabled: true,
    },
  },
  secureJsonFields: {
    basicAuthPassword: true,
  },
};

const mocks: Record<string, Record<string, unknown>> = {
  'tempo-fresh': fresh,
  'tempo-full': fullyConfigured,
  'tempo-tracing': tracingLinks,
  'tempo-basic-auth': basicAuth,
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
  title: 'Editors/Config/Tempo',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="tempo-fresh" dsName="Tempo" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="tempo-full" dsName="Tempo Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const TracingLinks = () => (
  <StoryModeWrapper schema={schema} dsUid="tempo-tracing" dsName="Tempo Tracing Links" onSuccess={noop} />
);
TracingLinks.storyName = 'Tracing links configured';

export const BasicAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="tempo-basic-auth" dsName="Tempo Basic Auth" onSuccess={noop} />
);
BasicAuth.storyName = 'Basic authentication';
