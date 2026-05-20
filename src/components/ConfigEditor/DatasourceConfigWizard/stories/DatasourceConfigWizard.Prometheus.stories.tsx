import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import prometheusSchemaJson from '../../../../datasource/schema/datasources/prometheus.schema.json';

const schema = prometheusSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Prometheus',
  id: 1,
  uid: 'prom-fresh',
  type: 'prometheus',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Prometheus Production',
  id: 2,
  uid: 'prom-full',
  type: 'prometheus',
  url: 'http://mimir-prod:9090',
  basicAuth: false,
  jsonData: {
    httpMethod: 'POST',
    timeInterval: '15s',
    queryTimeout: '60s',
    prometheusType: 'Mimir',
    prometheusVersion: '2.12.0',
    cacheLevel: 'Medium',
    defaultEditor: 'builder',
    disableMetricsLookup: false,
    incrementalQuerying: false,
    disableRecordingRules: false,
    manageAlerts: true,
    allowAsRecordingRulesTarget: true,
    seriesEndpoint: false,
    seriesLimit: 40000,
  },
  secureJsonFields: {},
};

const exemplarsConfigured: Record<string, unknown> = {
  name: 'Prometheus with Exemplars',
  id: 3,
  uid: 'prom-exemplars',
  type: 'prometheus',
  url: 'http://prometheus:9090',
  jsonData: {
    httpMethod: 'POST',
    timeInterval: '15s',
    prometheusType: 'Prometheus',
    cacheLevel: 'Low',
    exemplarTraceIdDestinations: [
      {
        name: 'traceID',
        datasourceUid: 'tempo-uid',
      },
    ],
  },
  secureJsonFields: {},
};

const incrementalQuerying: Record<string, unknown> = {
  name: 'Prometheus Incremental',
  id: 4,
  uid: 'prom-incremental',
  type: 'prometheus',
  url: 'http://mimir-prod:9090',
  jsonData: {
    httpMethod: 'POST',
    timeInterval: '15s',
    prometheusType: 'Mimir',
    cacheLevel: 'Low',
    incrementalQuerying: true,
    incrementalQueryOverlapWindow: '10m',
  },
  secureJsonFields: {},
};

const basicAuth: Record<string, unknown> = {
  name: 'Prometheus Basic Auth',
  id: 5,
  uid: 'prom-basic-auth',
  type: 'prometheus',
  url: 'http://prometheus:9090',
  basicAuth: true,
  basicAuthUser: 'admin',
  jsonData: {
    httpMethod: 'POST',
    prometheusType: 'Prometheus',
    cacheLevel: 'Low',
  },
  secureJsonFields: {
    basicAuthPassword: true,
  },
};

const mocks: Record<string, Record<string, unknown>> = {
  'prom-fresh': fresh,
  'prom-full': fullyConfigured,
  'prom-exemplars': exemplarsConfigured,
  'prom-incremental': incrementalQuerying,
  'prom-basic-auth': basicAuth,
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
  title: 'Editors/Config/Prometheus',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="prom-fresh" dsName="Prometheus" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="prom-full" dsName="Prometheus Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured (Mimir)';

export const ExemplarsConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="prom-exemplars" dsName="Prometheus with Exemplars" onSuccess={noop} />
);
ExemplarsConfigured.storyName = 'Exemplars configured';

export const IncrementalQuerying = () => (
  <StoryModeWrapper schema={schema} dsUid="prom-incremental" dsName="Prometheus Incremental" onSuccess={noop} />
);
IncrementalQuerying.storyName = 'Incremental querying enabled';

export const BasicAuth = () => (
  <StoryModeWrapper schema={schema} dsUid="prom-basic-auth" dsName="Prometheus Basic Auth" onSuccess={noop} />
);
BasicAuth.storyName = 'Basic authentication';
