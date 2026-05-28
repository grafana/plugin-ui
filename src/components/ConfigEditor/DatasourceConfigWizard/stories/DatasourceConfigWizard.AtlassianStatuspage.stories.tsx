import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/grafana-atlassianstatuspage-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

const fresh: Record<string, unknown> = {
  name: 'Atlassian Statuspage',
  id: 1,
  uid: 'asp-fresh',
  type: 'grafana-atlassianstatuspage-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Atlassian Statuspage Production',
  id: 2,
  uid: 'asp-full',
  type: 'grafana-atlassianstatuspage-datasource',
  url: '',
  jsonData: {
    variables: {
      url: 'https://status.example.com',
    },
  },
  secureJsonFields: {},
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'asp-full-ro',
  id: 3,
  name: 'Atlassian Statuspage (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'asp-fresh': fresh,
  'asp-full': fullyConfigured,
  'asp-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/AtlassianStatuspage',
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
  <StoryModeWrapper schema={schema} dsUid="asp-fresh" dsName="Atlassian Statuspage" onSuccess={noop} />
);
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="asp-full" dsName="Atlassian Statuspage Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="asp-full-ro" dsName="Atlassian Statuspage (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
