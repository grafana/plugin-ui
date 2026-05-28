import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import schemaJson from '../../../../schema/registry/grafana-vercel-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

const fresh: Record<string, unknown> = {
  name: 'Vercel',
  id: 1,
  uid: 'vercel-fresh',
  type: 'grafana-vercel-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Vercel Production',
  id: 2,
  uid: 'vercel-full',
  type: 'grafana-vercel-datasource',
  url: '',
  jsonData: {
    variables: {
      team_id: 'team_1a2b3c4d5e6f7g8h9i0j1k2l',
    },
  },
  secureJsonFields: {
    'vercel.token': true,
  },
};

const tokenOnly: Record<string, unknown> = {
  name: 'Vercel Personal',
  id: 3,
  uid: 'vercel-personal',
  type: 'grafana-vercel-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {
    'vercel.token': true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'vercel-full-ro',
  id: 4,
  name: 'Vercel (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'vercel-fresh': fresh,
  'vercel-full': fullyConfigured,
  'vercel-personal': tokenOnly,
  'vercel-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/Vercel',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="vercel-fresh" dsName="Vercel" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="vercel-full" dsName="Vercel Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const PersonalAccount = () => (
  <StoryModeWrapper schema={schema} dsUid="vercel-personal" dsName="Vercel Personal" onSuccess={noop} />
);
PersonalAccount.storyName = 'Personal account (no team)';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="vercel-full-ro" dsName="Vercel (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
