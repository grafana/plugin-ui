import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import mysqlSchemaJson from '../../../../schema/registry/mysql.schema.json';

const schema = mysqlSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'MySQL',
  id: 1,
  uid: 'mysql-fresh',
  type: 'mysql',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'MySQL Production',
  id: 2,
  uid: 'mysql-full',
  type: 'mysql',
  url: 'mysql-test:3306',
  user: 'root',
  jsonData: {
    database: 'testdb',
    tlsAuth: false,
    tlsAuthWithCACert: false,
    tlsSkipVerify: false,
    allowCleartextPasswords: false,
    timezone: '',
    timeInterval: '1m',
    maxOpenConns: 100,
    maxIdleConns: 2,
    connMaxLifetime: 14400,
  },
  secureJsonFields: {
    password: true,
  },
};

const tlsEnabled: Record<string, unknown> = {
  name: 'MySQL TLS',
  id: 3,
  uid: 'mysql-tls',
  type: 'mysql',
  url: 'mysql-test:3306',
  user: 'root',
  jsonData: {
    database: 'testdb',
    tlsAuth: true,
    tlsAuthWithCACert: true,
    tlsSkipVerify: false,
    allowCleartextPasswords: false,
    timezone: '',
    timeInterval: '1m',
    maxOpenConns: 100,
    maxIdleConns: 2,
    connMaxLifetime: 14400,
  },
  secureJsonFields: {
    password: true,
    tlsCACert: true,
    tlsClientCert: true,
    tlsClientKey: true,
  },
};

const cleartextPasswords: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'mysql-cleartext',
  id: 4,
  name: 'MySQL (cleartext passwords)',
  jsonData: { ...(fullyConfigured.jsonData as object), allowCleartextPasswords: true },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'mysql-full-ro',
  id: 5,
  name: 'MySQL Production (provisioned)',
  readOnly: true,
};

const mocks: Record<string, Record<string, unknown>> = {
  'mysql-fresh': fresh,
  'mysql-full': fullyConfigured,
  'mysql-tls': tlsEnabled,
  'mysql-cleartext': cleartextPasswords,
  'mysql-full-ro': fullyConfiguredReadOnly,
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
  title: 'Editors/Config/MySQL',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="mysql-fresh" dsName="MySQL" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="mysql-full" dsName="MySQL Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured';

export const TLSEnabled = () => (
  <StoryModeWrapper schema={schema} dsUid="mysql-tls" dsName="MySQL TLS" onSuccess={noop} />
);
TLSEnabled.storyName = 'TLS enabled';

export const CleartextPasswords = () => (
  <StoryModeWrapper schema={schema} dsUid="mysql-cleartext" dsName="MySQL (cleartext passwords)" onSuccess={noop} />
);
CleartextPasswords.storyName = 'Allow cleartext passwords';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="mysql-full-ro" dsName="MySQL Production (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
