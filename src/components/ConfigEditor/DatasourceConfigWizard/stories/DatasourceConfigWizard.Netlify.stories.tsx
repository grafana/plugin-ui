import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/grafana-netlify-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

const fresh: Record<string, unknown> = {
  name: 'Netlify',
  id: 1,
  uid: 'netlify-fresh',
  type: 'grafana-netlify-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Netlify Production',
  id: 2,
  uid: 'netlify-full',
  type: 'grafana-netlify-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {
    'Netlify.token': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'netlify-full-ro',
  id: 3,
  name: 'Netlify (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'netlify-fresh': fresh,
  'netlify-full': fullyConfigured,
  'netlify-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Netlify',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="netlify-fresh" dsName="Netlify" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="netlify-full" dsName="Netlify Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="netlify-full-ro" dsName="Netlify (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
