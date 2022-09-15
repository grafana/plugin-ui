import { DataFrameView, DataSourceInstanceSettings, DataSourceRef, MetricFindValue, ScopedVars, TimeRange, VariableModel } from '@grafana/data';
import { DataSourceWithBackend, TemplateSrv } from '@grafana/runtime';
import { SQLQuery, SQLOptions, DB, SqlQueryModel, ResponseParser } from '../components/QueryEditor/types';
export interface SearchFilterOptions {
    searchFilter?: string;
}
export interface VariableWithMultiSupport extends VariableWithOptions {
    multi: boolean;
    includeAll: boolean;
    allValue?: string | null;
}
export interface VariableWithOptions extends VariableModel {
    current: VariableOption;
    options: VariableOption[];
    query: string;
}
export interface VariableOption {
    selected: boolean;
    text: string | string[];
    value: string | string[];
    isNone?: boolean;
}
export declare abstract class SqlDatasource extends DataSourceWithBackend<SQLQuery, SQLOptions> {
    protected readonly templateSrv: TemplateSrv;
    id: number;
    name: string;
    interval: string;
    db: DB;
    annotations: {};
    constructor(instanceSettings: DataSourceInstanceSettings<SQLOptions>, templateSrv?: TemplateSrv);
    abstract getDB(dsID?: number): DB;
    abstract getQueryModel(target?: SQLQuery, templateSrv?: TemplateSrv, scopedVars?: ScopedVars): SqlQueryModel;
    abstract getResponseParser(): ResponseParser;
    interpolateVariable: (value: string | string[] | number, variable: VariableWithMultiSupport) => string | number;
    interpolateVariablesInQueries(queries: SQLQuery[], scopedVars: ScopedVars): SQLQuery[];
    filterQuery(query: SQLQuery): boolean;
    applyTemplateVariables(target: SQLQuery, scopedVars: ScopedVars): Record<string, string | DataSourceRef | SQLQuery['format']>;
    clean(value: string): string;
    metricFindQuery(query: string, optionalOptions?: MetricFindQueryOptions): Promise<MetricFindValue[]>;
    runSql<T>(query: string, options?: RunSQLOptions): Promise<DataFrameView<T>>;
    private runMetaQuery;
    testDatasource(): Promise<{
        status: string;
        message: string;
    }>;
    targetContainsTemplate(target: SQLQuery): boolean;
}
interface RunSQLOptions extends MetricFindQueryOptions {
    refId?: string;
}
interface MetricFindQueryOptions extends SearchFilterOptions {
    range?: TimeRange;
}
export declare const SEARCH_FILTER_VARIABLE = "__searchFilter";
export declare const containsSearchFilter: (query: string | unknown) => boolean;
export interface SearchFilterOptions {
    searchFilter?: string;
}
export declare const getSearchFilterScopedVar: (args: {
    query: string;
    wildcardChar: string;
    options?: SearchFilterOptions;
}) => ScopedVars;
export {};
