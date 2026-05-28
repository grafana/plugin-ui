import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/grafana-cloudflare-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

const fresh: Record<string, unknown> = {
  name: 'Cloudflare',
  id: 1,
  uid: 'cf-fresh',
  type: 'grafana-cloudflare-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Cloudflare Production',
  id: 2,
  uid: 'cf-full',
  type: 'grafana-cloudflare-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {
    'cloudflare.token': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'cf-full-ro',
  id: 3,
  name: 'Cloudflare (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'cf-fresh': fresh,
  'cf-full': fullyConfigured,
  'cf-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Cloudflare',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="cf-fresh" dsName="Cloudflare" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="cf-full" dsName="Cloudflare Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="cf-full-ro" dsName="Cloudflare (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
