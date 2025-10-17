import { type JsonTree } from '@react-awesome-query-builder/ui';

import {
  type DataFrame,
  type DataSourceJsonData,
  type MetricFindValue,
  type SelectableValue,
  type TimeRange,
  toOption as toOptionFromData,
} from '@grafana/data';

import { type DataQuery } from '@grafana/schema';

import { type QueryWithDefaults } from './defaults';
import {
  type QueryEditorFunctionExpression,
  type QueryEditorGroupByExpression,
  type QueryEditorPropertyExpression,
} from './expressions';
import { type CompletionItemKind, type LanguageCompletionProvider } from '../SQLEditor';

export interface SqlQueryForInterpolation {
  dataset?: string;
  alias?: string;
  format?: QueryFormat;
  rawSql?: string;
  refId: string;
  hide?: boolean;
}

export interface SQLConnectionLimits {
  maxOpenConns: number;
  maxIdleConns: number;
  connMaxLifetime: number;
}

export interface SQLOptions extends SQLConnectionLimits, DataSourceJsonData {
  tlsAuth: boolean;
  tlsAuthWithCACert: boolean;
  timezone: string;
  tlsSkipVerify: boolean;
  user: string;
  database: string;
  url: string;
  timeInterval: string;
}

// Match the Enums Expected in SqlUtil and SqlDS
// https://github.com/grafana/grafana-plugin-sdk-go/blob/main/data/sqlutil/query.go#L18-L29
export enum QueryFormat {
  Timeseries,
  Table,
  Logs,
  Trace,
  OptionMulti,
}

export enum EditorMode {
  Builder = 'builder',
  Code = 'code',
}

export interface SQLQuery extends DataQuery {
  alias?: string;
  format?: QueryFormat;
  rawSql?: string;
  dataset?: string; // When catalog is present, dataset represents the schema. Otherwise, it's the dataset.
  catalog?: string;
  table?: string;
  sql?: SQLExpression;
  editorMode?: EditorMode;
  rawQuery?: boolean;
}

export interface NameValue {
  name: string;
  value: string;
}

export type SQLFilters = NameValue[];

export interface SQLExpression {
  columns?: QueryEditorFunctionExpression[];
  whereJsonTree?: JsonTree;
  whereString?: string;
  filters?: SQLFilters;
  groupBy?: QueryEditorGroupByExpression[];
  orderBy?: QueryEditorPropertyExpression;
  orderByDirection?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

export interface TableSchema {
  name?: string;
  schema?: TableFieldSchema[];
}

export interface TableFieldSchema {
  name: string;
  description?: string;
  type: string;
  repeated: boolean;
  schema: TableFieldSchema[];
}

export interface QueryRowFilter {
  filter: boolean;
  group: boolean;
  order: boolean;
  preview: boolean;
}

export const QUERY_FORMAT_OPTIONS = [
  { label: 'Time series', value: QueryFormat.Timeseries },
  { label: 'Table', value: QueryFormat.Table },
];

const backWardToOption = (value: string) => ({ label: value, value });

export const toOption = toOptionFromData ?? backWardToOption;

export interface ResourceSelectorProps {
  disabled?: boolean;
  className?: string;
  applyDefault?: boolean;
}
// React Awesome Query builder field types.
// These are responsible for rendering the correct UI for the field.
export type RAQBFieldTypes = 'text' | 'number' | 'boolean' | 'datetime' | 'date' | 'time';

export interface SQLSelectableValue extends SelectableValue {
  type?: string;
  raqbFieldType?: RAQBFieldTypes;
}

export interface Aggregate {
  id: string;
  name: string;
  description?: string;
}

export interface DB {
  init?: (datasourceId?: string) => Promise<boolean>;
  datasets: (catalog?: string) => Promise<string[]>; // When catalog is provided, returns schemas for that catalog
  catalogs?: () => Promise<string[]>;
  tables: (dataset?: string, catalog?: string, schema?: string) => Promise<string[]>;
  fields: (query: SQLQuery, order?: boolean) => Promise<SQLSelectableValue[]>;
  validateQuery: (query: SQLQuery, range?: TimeRange) => Promise<ValidationResults>;
  dsID: () => number;
  dispose?: (dsID?: string) => void;
  lookup: (path?: string) => Promise<Array<{ name: string; completion: string }>>;
  getSqlCompletionProvider: () => LanguageCompletionProvider;
  toRawSql?: (query: SQLQuery) => string;
  functions: () => Promise<Aggregate[]>;
  labels?: Map<'dataset', string>;
  disableDatasets?: boolean;
  disableCatalogs?: boolean;
}

export interface QueryEditorProps {
  db: DB;
  query: QueryWithDefaults;
  onChange: (query: SQLQuery) => void;
  range?: TimeRange;
}

export interface ValidationResults {
  query: SQLQuery;
  rawSql?: string;
  error: string;
  isError: boolean;
  isValid: boolean;
  statistics?: {
    TotalBytesProcessed: number;
  } | null;
}

export interface SqlQueryModel {
  interpolate: () => string;
  quoteLiteral: (v: string) => string;
}

export interface ResponseParser {
  transformMetricFindResponse: (frame: DataFrame) => MetricFindValue[];
}

export interface MetaDefinition {
  name: string;
  completion?: string;
  kind: CompletionItemKind;
}
