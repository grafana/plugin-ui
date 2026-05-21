import React from 'react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { StoryModeWrapper } from './StoryModeWrapper';
import infinitySchemaJson from '../../../../schema/registry/yesoreyeram-infinity-datasource.schema.json';

const schema = infinitySchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Mock datasources
// ============================================================

const fresh: Record<string, unknown> = {
  name: 'Infinity',
  id: 10,
  uid: 'inf-fresh',
  type: 'yesoreyeram-infinity-datasource',
  url: '',
  jsonData: {},
  secureJsonFields: {},
};

const fullyConfigured: Record<string, unknown> = {
  name: 'Infinity Production',
  id: 11,
  uid: 'inf-full',
  type: 'yesoreyeram-infinity-datasource',
  url: 'https://api.example.com/v2',
  basicAuth: false,
  jsonData: {
    auth_method: 'apiKey',
    apiKeyKey: 'X-API-Key',
    apiKeyType: 'header',
    oauthPassThru: false,
    tlsSkipVerify: false,
    tlsAuth: false,
    tlsAuthWithCACert: false,
    timeoutInSeconds: 30,
    httpHeaderName1: 'X-Custom-Org',
    httpHeaderName2: 'X-Request-ID',
    secureQueryName1: 'token',
    allowedHosts: ['api.example.com', 'cdn.example.com'],
    ignoreStatusCodeCheck: true,
    allowDangerousHTTPMethods: false,
    pathEncodedUrlsEnabled: true,
    keepCookies: ['session_id'],
    unsecuredQueryHandling: 'warn',
    proxy_type: 'env',
    customHealthCheckEnabled: true,
    customHealthCheckUrl: 'https://api.example.com/v2/health',
    enableSecureSocksProxy: false,
  },
  secureJsonFields: {
    apiKeyValue: true,
    httpHeaderValue1: true,
    httpHeaderValue2: true,
    secureQueryValue1: true,
  },
};

const fullyConfiguredReadOnly: Record<string, unknown> = {
  ...fullyConfigured,
  uid: 'inf-full-ro',
  id: 12,
  name: 'Infinity Production (provisioned)',
  readOnly: true,
};

const oauth2Configured: Record<string, unknown> = {
  name: 'Infinity OAuth2',
  id: 13,
  uid: 'inf-oauth2',
  type: 'yesoreyeram-infinity-datasource',
  url: 'https://api.oauth-example.com',
  basicAuth: false,
  jsonData: {
    auth_method: 'oauth2',
    oauth2: {
      oauth2_type: 'client_credentials',
      client_id: 'my-client-id',
      token_url: 'https://auth.example.com/oauth/token',
      scopes: ['read', 'write'],
      authStyle: 0,
      authHeader: '',
      tokenTemplate: '',
    },
    oauthPassThru: false,
    timeoutInSeconds: 60,
    unsecuredQueryHandling: 'deny',
  },
  secureJsonFields: {
    oauth2ClientSecret: true,
  },
};

const oauth2JwtConfigured: Record<string, unknown> = {
  name: 'Infinity OAuth2 JWT',
  id: 15,
  uid: 'inf-oauth2-jwt',
  type: 'yesoreyeram-infinity-datasource',
  url: 'https://api.oauth-jwt-example.com',
  basicAuth: false,
  jsonData: {
    auth_method: 'oauth2',
    oauth2: {
      oauth2_type: 'jwt',
      email: 'service-account@project.iam.gserviceaccount.com',
      private_key_id: 'key-id-123',
      token_url: 'https://oauth2.googleapis.com/token',
      subject: '',
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      authHeader: '',
      tokenTemplate: '',
    },
    oauthPassThru: false,
    timeoutInSeconds: 60,
  },
  secureJsonFields: {
    oauth2JWTPrivateKey: true,
  },
};

const awsConfigured: Record<string, unknown> = {
  name: 'Infinity AWS',
  id: 14,
  uid: 'inf-aws',
  type: 'yesoreyeram-infinity-datasource',
  url: 'https://aps-workspaces.us-east-1.amazonaws.com',
  basicAuth: false,
  jsonData: {
    auth_method: 'aws',
    authType: 'keys',
    region: 'us-east-1',
    service: 'aps',
    oauthPassThru: false,
    timeoutInSeconds: 60,
  },
  secureJsonFields: {
    awsAccessKey: true,
    awsSecretKey: true,
  },
};

const mocks: Record<string, Record<string, unknown>> = {
  'inf-fresh': fresh,
  'inf-full': fullyConfigured,
  'inf-full-ro': fullyConfiguredReadOnly,
  'inf-oauth2': oauth2Configured,
  'inf-oauth2-jwt': oauth2JwtConfigured,
  'inf-aws': awsConfigured,
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
  title: 'Editors/Config/Infinity',
  component: StoryModeWrapper,
  decorators: [
    (Story: React.ComponentType) => {
      mockBackendSrv();
      return <Story />;
    },
  ],
};

const noop = () => {};

export const Fresh = () => <StoryModeWrapper schema={schema} dsUid="inf-fresh" dsName="Infinity" onSuccess={noop} />;
Fresh.storyName = 'Fresh';

export const FullyConfigured = () => (
  <StoryModeWrapper schema={schema} dsUid="inf-full" dsName="Infinity Production" onSuccess={noop} />
);
FullyConfigured.storyName = 'Fully configured (API Key)';

export const OAuth2 = () => (
  <StoryModeWrapper schema={schema} dsUid="inf-oauth2" dsName="Infinity OAuth2" onSuccess={noop} />
);
OAuth2.storyName = 'OAuth2 configured';

export const OAuth2JWT = () => (
  <StoryModeWrapper schema={schema} dsUid="inf-oauth2-jwt" dsName="Infinity OAuth2 JWT" onSuccess={noop} />
);
OAuth2JWT.storyName = 'OAuth2 configured (JWT)';

export const AWS = () => <StoryModeWrapper schema={schema} dsUid="inf-aws" dsName="Infinity AWS" onSuccess={noop} />;
AWS.storyName = 'AWS configured';

export const ReadOnly = () => (
  <StoryModeWrapper schema={schema} dsUid="inf-full-ro" dsName="Infinity Production (provisioned)" onSuccess={noop} />
);
ReadOnly.storyName = 'Read-only (provisioned)';
