import { DataSourceInstanceSettings, QueryHint } from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';
import { Chance } from 'chance';
import { mockDataSourcePluginMeta } from './Plugin';
import { generateBoolean, undefinedOr } from './utils';

class DatasourceMock extends DataSourceWithBackend {
  // DataSourceWithBackend
  query = jest.fn();
  filterQuery = undefinedOr(generateBoolean);
  applyTemplateVariables = jest.fn();
  getResource = jest.fn();
  postResource = jest.fn();
  callHealthCheck = jest.fn();
  testDatasource = jest.fn();
  // DataSourceApi
  uid = Chance().guid();
  name = Chance().word();
  id = 1;
  type = Chance().word();
  interval = Chance().word();
  importQueries = jest.fn();
  init = jest.fn();
  getQueryHints = jest.fn().mockReturnValue([mockQueryHint()]);
  getQueryDisplayText = jest.fn().mockReturnValue(Chance().word());
  metricFindQuery = jest.fn();
  getTagKeys = jest.fn();
  getTagValues = jest.fn();
  components = {};
  meta = mockDataSourcePluginMeta();
  targetContainsTemplate = jest.fn();
  modifyQuery = jest.fn();
  getHighlighterExpression = jest.fn();
  languageProvider = jest.fn();
  getVersion = jest.fn();
  interpolateVariablesInQueries = jest.fn();
  annotations = {};
  annotationQuery = jest.fn();
  streamOptionsProvider = jest.fn();
  getRef = jest.fn();
  protected getRequestHeaders = jest.fn();
}

export const mockDatasource = () =>
  new DatasourceMock(mockDatasourceInstanceSettings());

const mockQueryHint = (): QueryHint => ({
  type: Chance().word(),
  label: Chance().word(),
  fix: {
    label: Chance().word(),
    action: {
      type: Chance().word(),
      query: Chance().word(),
      preventSubmit: generateBoolean(),
    },
  },
});

export const mockDatasourceInstanceSettings = (): DataSourceInstanceSettings => ({
  id: Chance().integer(),
  uid: Chance().word(),
  type: Chance().word(),
  name: Chance().word(),
  meta: mockDataSourcePluginMeta(),
  url: Chance().word(),
  jsonData: {},
  username: Chance().word(),
  password: Chance().word(),
  database: Chance().word(),
  basicAuth: Chance().word(),
  withCredentials: generateBoolean(),
  access: Chance().pickone(["direct", "proxy"]),
  readOnly: false,
});
