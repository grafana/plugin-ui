import { type DataSourceApi, type DataSourceSettings, type SelectableValue } from '@grafana/data';
import {
  type DB,
  type SQLExpression,
  type SQLQuery,
  type SqlDatasource,
  type ValidationResults,
  type VisualQuery,
  type VisualQueryModeller,
} from '@grafana/plugin-ui';

export const noop = (): void => {};

/**
 * Fake `DB` whose async methods resolve to empty results. Enough to satisfy the
 * type contract and let the resource selectors / SQL query editor mount; the
 * real data fetching is exercised by concrete data source plugins, not here.
 */
export const fakeDb: DB = {
  init: async () => true,
  datasets: async () => [],
  catalogs: async () => [],
  tables: async () => [],
  fields: async () => [],
  validateQuery: async (query: SQLQuery): Promise<ValidationResults> => ({
    query,
    rawSql: query.rawSql ?? '',
    error: '',
    isError: false,
    isValid: true,
  }),
  dsID: () => 1,
  dispose: noop,
  lookup: async () => [],
  // The completion provider is only invoked by the Monaco-backed raw editor,
  // which is not reachable in the builder-mode default used by the gallery.
  getSqlCompletionProvider: () => ({}) as ReturnType<DB['getSqlCompletionProvider']>,
  toRawSql: () => '',
  functions: async () => [],
  disableDatasets: false,
  disableCatalogs: true,
};

export const fakeQuery: SQLQuery = {
  refId: 'A',
  rawSql: 'SELECT 1',
  dataset: 'public',
  table: 'example',
};

export const fakeSqlExpression: SQLExpression = {
  columns: [],
  groupBy: [],
  filters: [],
};

/**
 * Minimal `SqlDatasource` stand-in exposing just the surface `SqlQueryEditor`
 * touches at render time (`getDB`, `dataset`, `id`).
 */
export const fakeSqlDatasource = {
  id: 1,
  uid: 'fixture-sql',
  name: 'Fixture SQL',
  type: 'fixture',
  dataset: 'public',
  getDB: () => fakeDb,
} as unknown as SqlDatasource;

/** Minimal `DataSourceApi` stand-in for the visual-query-builder components. */
export const fakeDataSource = {
  name: 'fixture',
  type: 'fixture',
  uid: 'fixture',
  id: 1,
  getQueryHints: () => [],
  modifyQuery: (q: unknown) => q,
} as unknown as DataSourceApi;

/** Stub implementing the `VisualQueryModeller` interface. */
export const fakeQueryModeller: VisualQueryModeller = {
  getOperationsForCategory: () => [],
  getAlternativeOperations: () => [],
  getCategories: () => [],
  getOperationDefinition: () => undefined,
  renderQuery: () => '',
  renderLabels: () => '',
  innerQueryPlaceholder: '<expr>',
};

export const fakeVisualQuery: VisualQuery = {
  metric: '',
  labels: [],
  operations: [],
};

/** Prism-style language descriptor used by `RawQuery` / `OperationListExplained`. */
export const fakeLanguage = { grammar: {}, name: 'sql' };

export const emptyOptions: Array<SelectableValue<string>> = [];

/**
 * Build a `DataSourceSettings`-shaped object from the plugin's editor options so
 * config components that expect the full settings object (e.g.
 * `CustomHeadersSettings`, `SecureSocksProxyToggle`) receive a valid value.
 */
export function toDataSourceSettings(
  jsonData: Record<string, unknown>,
  secureJsonFields: Record<string, boolean> = {}
): DataSourceSettings<any, any> {
  return {
    id: 1,
    uid: 'fixture',
    orgId: 1,
    name: 'Plugin UI Fixture',
    type: 'grafana-pluginuifixture-datasource',
    typeName: 'Plugin UI Fixture',
    typeLogoUrl: '',
    access: 'proxy',
    url: '',
    user: '',
    database: '',
    basicAuth: false,
    basicAuthUser: '',
    isDefault: false,
    jsonData,
    secureJsonFields,
    readOnly: false,
    withCredentials: false,
  } as unknown as DataSourceSettings<any, any>;
}
