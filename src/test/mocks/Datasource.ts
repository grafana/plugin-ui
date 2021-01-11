import { PluginType } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';
import { Chance } from 'chance';
import { generateBoolean } from './utils';

export const mockDatasource = (): DataSourceWithBackend => ({
  applyTemplateVariables: jest.fn(),
  metricFindQuery: jest.fn(),
  query: jest.fn(),
  getResource: jest.fn(),
  postResource: jest.fn(),
  callHealthCheck: jest.fn(),
  testDatasource: jest.fn(),
  name: Chance().word(),
  id: 1,
  meta: {
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
    type: Chance().pickone([
      PluginType.panel,
      PluginType.datasource,
      PluginType.app,
      PluginType.renderer,
    ]),
    info: {
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
    },
    module: Chance().word(),
    baseUrl: Chance().word(),
  },
});
