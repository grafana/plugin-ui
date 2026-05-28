import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/grafana-solarwinds-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

const fresh: Record<string, unknown> = {
  name: 'Solarwinds',
  id: 1,
  uid: 'sw-fresh',
  type: 'grafana-solarwinds-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Solarwinds Production',
  id: 2,
  uid: 'sw-full',
  type: 'grafana-solarwinds-datasource',
  url: '',
  jsonData: {
    variables: {
      url: 'https://solarwinds.example.com',
    },
    services: {
      solarwinds: {
        auth: {
          username: 'admin',
        },
      },
    },
  },
  secureJsonFields: {
    'solarwinds.password': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'sw-full-ro',
  id: 3,
  name: 'Solarwinds (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'sw-fresh': fresh,
  'sw-full': fullyConfigured,
  'sw-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Solarwinds',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="sw-fresh" dsName="Solarwinds" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="sw-full" dsName="Solarwinds Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="sw-full-ro" dsName="Solarwinds (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
