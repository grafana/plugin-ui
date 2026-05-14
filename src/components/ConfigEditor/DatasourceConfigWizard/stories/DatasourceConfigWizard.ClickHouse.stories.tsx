import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import clickhouseSchemaJson from '../../../../datasource/schema/datasources/grafana-clickhouse-datasource.schema.json';

const schema = clickhouseSchemaJson as unknown as DatasourceConfigSchema;

const mockDatasources: Record<string, Record<string, unknown>> = {
  'ch-fresh': {
    name: 'ch-fresh',
    id: 1,
    uid: 'ch-fresh',
    type: 'grafana-clickhouse-datasource',
    url: '',
    jsonData: {},
    secureJsonFields: {},
  },

  'ch-native': {
    name: 'ch-native',
    id: 2,
    uid: 'ch-native',
    type: 'grafana-clickhouse-datasource',
    url: '',
    jsonData: {
      host: 'clickhouse.internal',
      port: 9000,
      protocol: 'native',
      username: 'default',
    },
    secureJsonFields: {
      password: true,
    },
  },

  'ch-http': {
    name: 'ch-http',
    id: 3,
    uid: 'ch-http',
    type: 'grafana-clickhouse-datasource',
    url: '',
    jsonData: {
      host: 'clickhouse.cloud.example.com',
      port: 8443,
      protocol: 'http',
      secure: true,
      username: 'analytics',
      path: '/',
    },
    secureJsonFields: {
      password: true,
    },
  },

  'ch-secure': {
    name: 'ch-secure',
    id: 4,
    uid: 'ch-secure',
    type: 'grafana-clickhouse-datasource',
    url: '',
    jsonData: {
      host: 'clickhouse.secure.example.com',
      port: 9440,
      protocol: 'native',
      secure: true,
      username: 'readonly',
      tlsSkipVerify: false,
    },
    secureJsonFields: {
      password: true,
      tlsCACert: true,
    },
  },

  'ch-provisioned': {
    name: 'ch-provisioned',
    id: 5,
    uid: 'ch-provisioned',
    type: 'grafana-clickhouse-datasource',
    url: '',
    readOnly: true,
    jsonData: {
      host: 'clickhouse.prod',
      port: 9000,
      protocol: 'native',
      username: 'grafana',
    },
    secureJsonFields: {
      password: true,
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
  title: 'Editors/Config/ClickHouse',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv(mockDatasources);
      return <Story />;
    },
  ],
};

const noop = () => {};

export const FreshNoConfig = () => (
  <StoryModeWrapper schema={schema} dsUid="ch-fresh" dsName="ch-fresh" onSuccess={noop} />
);
FreshNoConfig.storyName = 'Default';

export const NativeProtocol = () => (
  <StoryModeWrapper schema={schema} dsUid="ch-native" dsName="ch-native" onSuccess={noop} />
);
NativeProtocol.storyName = 'Native protocol';

export const HttpProtocol = () => (
  <StoryModeWrapper schema={schema} dsUid="ch-http" dsName="ch-http" onSuccess={noop} />
);
HttpProtocol.storyName = 'HTTP protocol (secure)';

export const SecureWithTls = () => (
  <StoryModeWrapper schema={schema} dsUid="ch-secure" dsName="ch-secure" onSuccess={noop} />
);
SecureWithTls.storyName = 'Secure with TLS';

export const Provisioned = () => (
  <StoryModeWrapper schema={schema} dsUid="ch-provisioned" dsName="ch-provisioned" onSuccess={noop} />
);
Provisioned.storyName = 'Read-only (provisioned)';
