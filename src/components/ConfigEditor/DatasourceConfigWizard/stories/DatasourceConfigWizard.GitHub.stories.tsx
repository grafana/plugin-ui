import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import { DatasourceConfigWizard } from '../DatasourceConfigWizard';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/config';
import githubSchemaJson from './schemas/github.schema.json';

const schema = githubSchemaJson as unknown as DatasourceConfigSchema;

const mockDatasources: Record<string, Record<string, unknown>> = {
  'gh-fresh': {
    name: 'gh-fresh',
    id: 1,
    uid: 'gh-fresh',
    type: 'grafana-github-datasource',
    url: '',
    jsonData: {},
    secureJsonFields: {},
  },

  'gh-pat': {
    name: 'gh-pat',
    id: 2,
    uid: 'gh-pat',
    type: 'grafana-github-datasource',
    url: '',
    jsonData: {
      selectedAuthType: 'personal-access-token',
      githubPlan: 'github-basic',
    },
    secureJsonFields: {
      accessToken: true,
    },
  },

  'gh-app': {
    name: 'gh-app',
    id: 3,
    uid: 'gh-app',
    type: 'grafana-github-datasource',
    url: '',
    jsonData: {
      selectedAuthType: 'github-app',
      githubPlan: 'github-enterprise-cloud',
      appId: '12345',
      installationId: '67890',
    },
    secureJsonFields: {
      privateKey: true,
    },
  },

  'gh-enterprise': {
    name: 'gh-enterprise',
    id: 4,
    uid: 'gh-enterprise',
    type: 'grafana-github-datasource',
    url: '',
    jsonData: {
      selectedAuthType: 'personal-access-token',
      githubPlan: 'github-enterprise-server',
      githubUrl: 'https://github.example.com',
    },
    secureJsonFields: {
      accessToken: true,
    },
  },

  'gh-provisioned': {
    name: 'gh-provisioned',
    id: 5,
    uid: 'gh-provisioned',
    type: 'grafana-github-datasource',
    url: '',
    readOnly: true,
    jsonData: {
      selectedAuthType: 'personal-access-token',
      githubPlan: 'github-basic',
    },
    secureJsonFields: {
      accessToken: true,
    },
  },
};

function mockBackendSrv(mocks: Record<string, Record<string, unknown>>) {
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

export default {
  title: 'Editors/Config/GitHub',
  component: DatasourceConfigWizard,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv(mockDatasources);
      return <Story />;
    },
  ],
};

const noop = () => {};

export const FreshNoConfig = () => (
  <DatasourceConfigWizard schema={schema} dsUid="gh-fresh" dsName="gh-fresh" onSuccess={noop} />
);
FreshNoConfig.storyName = 'Default';

export const PersonalAccessToken = () => (
  <DatasourceConfigWizard schema={schema} dsUid="gh-pat" dsName="gh-pat" onSuccess={noop} />
);
PersonalAccessToken.storyName = 'Personal Access Token';

export const GitHubApp = () => (
  <DatasourceConfigWizard schema={schema} dsUid="gh-app" dsName="gh-app" onSuccess={noop} />
);
GitHubApp.storyName = 'GitHub App';

export const EnterpriseServer = () => (
  <DatasourceConfigWizard schema={schema} dsUid="gh-enterprise" dsName="gh-enterprise" onSuccess={noop} />
);
EnterpriseServer.storyName = 'Enterprise Server';

export const Provisioned = () => (
  <DatasourceConfigWizard schema={schema} dsUid="gh-provisioned" dsName="gh-provisioned" onSuccess={noop} />
);
Provisioned.storyName = 'Read-only (provisioned)';
