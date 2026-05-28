import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import logicMonitorSchemaJson from '../../../../schema/registry/grafana-logicmonitor-datasource.schema.json';

const schema = logicMonitorSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'LogicMonitor',
  id: 1,
  uid: 'lm-fresh',
  type: 'grafana-logicmonitor-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'LogicMonitor Production',
  id: 2,
  uid: 'lm-full',
  type: 'grafana-logicmonitor-datasource',
  url: '',
  jsonData: {
    variables: {
      account_name: 'mycompany',
    },
  },
  secureJsonFields: {
    'logicmonitor.token': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'lm-full-ro',
  id: 3,
  name: 'LogicMonitor Production (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'lm-fresh': fresh,
  'lm-full': fullyConfigured,
  'lm-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/LogicMonitor',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="lm-fresh" dsName="LogicMonitor" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="lm-full" dsName="LogicMonitor Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper
    schema={schema}
    dsUid="lm-full-ro"
    dsName="LogicMonitor Production (provisioned)"
    onSuccess={noop}
  />
);
ReadOnly.storyName = 'Read-only (provisioned)';
