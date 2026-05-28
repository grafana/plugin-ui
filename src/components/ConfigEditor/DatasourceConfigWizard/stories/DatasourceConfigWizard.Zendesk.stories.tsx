import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/grafana-zendesk-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

const fresh: Record<string, unknown> = {
  name: 'Zendesk',
  id: 1,
  uid: 'zd-fresh',
  type: 'grafana-zendesk-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Zendesk Production',
  id: 2,
  uid: 'zd-full',
  type: 'grafana-zendesk-datasource',
  url: '',
  jsonData: {
    variables: {
      subdomain: 'grafana',
    },
    services: {
      zendesk: {
        auth: {
          username: 'admin@example.com',
        },
      },
    },
  },
  secureJsonFields: {
    'zendesk.password': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'zd-full-ro',
  id: 3,
  name: 'Zendesk (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'zd-fresh': fresh,
  'zd-full': fullyConfigured,
  'zd-full-ro': fullyConfiguredReadOnly,
};

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

export default {
  title: 'Editors/Config/Zendesk',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="zd-fresh" dsName="Zendesk" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="zd-full" dsName="Zendesk Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="zd-full-ro" dsName="Zendesk (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
