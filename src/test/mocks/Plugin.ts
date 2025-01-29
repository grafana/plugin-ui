import { Chance } from 'chance';
import {
  type DataSourcePluginMeta,
  type PluginMetaInfo,
  type PluginMeta,
  PluginState,
  PluginSignatureStatus,
  type PluginInclude,
  PluginIncludeType,
  type PluginDependencies,
  PluginType,
} from '@grafana/data';
import { generateBoolean } from './utils';

export const mockDataSourcePluginMeta = (): DataSourcePluginMeta => ({
  builtIn: generateBoolean(),
  metrics: generateBoolean(),
  logs: generateBoolean(),
  annotations: generateBoolean(),
  alerting: generateBoolean(),
  tracing: generateBoolean(),
  mixed: generateBoolean(),
  hasQueryHelp: generateBoolean(),
  category: Chance().word(),
  queryOptions: {
    cacheTimeout: generateBoolean(),
    maxDataPoints: generateBoolean(),
    minInterval: generateBoolean(),
  },
  sort: 1,
  streaming: generateBoolean(),
  unlicensed: generateBoolean(),
  id: Chance().word(),
  name: Chance().word(),
  type: mockPluginType(),
  info: mockPluginMetaInfo(),
  module: Chance().word(),
  baseUrl: Chance().word(),
});

export const mockPluginMetaInfo = (): PluginMetaInfo => ({
  author: {
    name: Chance().word(),
    url: Chance().word(),
  },
  description: Chance().word(),
  links: [],
  logos: {
    large: Chance().word(),
    small: Chance().word(),
  },
  screenshots: [],
  updated: Chance().word(),
  version: Chance().word(),
});

export const mockPluginMeta = (): PluginMeta => ({
  id: Chance().word(),
  name: Chance().word(),
  type: mockPluginType(),
  info: mockPluginMetaInfo(),
  includes: [mockPluginInclude()],
  state: mockPluginState(),
  module: Chance().word(),
  baseUrl: Chance().word(),
  dependencies: mockPluginDependencies(),
  jsonData: {},
  secureJsonData: {},
  enabled: generateBoolean(),
  defaultNavUrl: Chance().word(),
  hasUpdate: generateBoolean(),
  enterprise: generateBoolean(),
  latestVersion: Chance().word(),
  pinned: generateBoolean(),
  signature: mockPluginSignatureStatus(),
  live: generateBoolean(),
});

export const mockPluginInclude = (): PluginInclude => ({
  type: mockPluginIncludeType(),
  name: Chance().word(),
  path: Chance().word(),
  icon: Chance().word(),
  role: Chance().word(),
  addToNav: generateBoolean(),
  component: Chance().word(),
});

export const mockPluginType = (): PluginType =>
  Chance().pickone([PluginType.panel, PluginType.datasource, PluginType.app, PluginType.renderer]);

export const mockPluginIncludeType = (): PluginIncludeType =>
  Chance().pickone([
    PluginIncludeType.dashboard,
    PluginIncludeType.page,
    PluginIncludeType.panel,
    PluginIncludeType.datasource,
  ]);

export const mockPluginState = (): PluginState =>
  Chance().pickone([PluginState.alpha, PluginState.beta, PluginState.deprecated]);

export const mockPluginDependencies = (): PluginDependencies => ({
  grafanaVersion: Chance().word(),
  plugins: [],
});

export const mockPluginSignatureStatus = (): PluginSignatureStatus =>
  Chance().pickone([
    PluginSignatureStatus.internal,
    PluginSignatureStatus.valid,
    PluginSignatureStatus.invalid,
    PluginSignatureStatus.modified,
    PluginSignatureStatus.missing,
  ]);
