import { JsonTree } from 'react-awesome-query-builder';
import { DataFrame, DataQuery, DataSourceJsonData, MetricFindValue, SelectableValue, TimeRange } from '@grafana/data';
import { QueryWithDefaults } from './defaults';
import { QueryEditorFunctionExpression, QueryEditorGroupByExpression, QueryEditorPropertyExpression } from './expressions';
import { CompletionItemKind, LanguageCompletionProvider } from '@grafana/experimental';
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
export declare enum QueryFormat {
    Timeseries = "time_series",
    Table = "table"
}
export declare enum EditorMode {
    Builder = "builder",
    Code = "code"
}
export interface SQLQuery extends DataQuery {
    alias?: string;
    format?: QueryFormat;
    rawSql?: string;
    dataset?: string;
    table?: string;
    sql?: SQLExpression;
    editorMode?: EditorMode;
    rawQuery?: boolean;
}
export interface NameValue {
    name: string;
    value: string;
}
export declare type SQLFilters = NameValue[];
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
export declare const QUERY_FORMAT_OPTIONS: {
    label: string;
    value: QueryFormat;
}[];
export declare const toOption: (value: string) => SelectableValue<string>;
export interface ResourceSelectorProps {
    disabled?: boolean;
    className?: string;
    applyDefault?: boolean;
}
export declare type RAQBFieldTypes = 'text' | 'number' | 'boolean' | 'datetime' | 'date' | 'time';
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
    datasets: () => Promise<string[]>;
    tables: (dataset?: string) => Promise<string[]>;
    fields: (query: SQLQuery, order?: boolean) => Promise<SQLSelectableValue[]>;
    validateQuery: (query: SQLQuery, range?: TimeRange) => Promise<ValidationResults>;
    dsID: () => number;
    dispose?: (dsID?: string) => void;
    lookup: (path?: string) => Promise<Array<{
        name: string;
        completion: string;
    }>>;
    getSqlCompletionProvider: () => LanguageCompletionProvider;
    toRawSql?: (query: SQLQuery) => string;
    functions: () => Promise<Aggregate[]>;
    labels: Map<string, string>;
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
export interface SQLConnectionLimits {
    maxOpenConns: number;
    maxIdleConns: number;
    connMaxLifetime: number;
}
