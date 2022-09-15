"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSearchFilterScopedVar = exports.containsSearchFilter = exports.SEARCH_FILTER_VARIABLE = exports.SqlDatasource = void 0;
const tslib_1 = require("tslib");
const rxjs_1 = require("rxjs");
const operators_1 = require("rxjs/operators");
const data_1 = require("@grafana/data");
const runtime_1 = require("@grafana/runtime");
const constants_1 = require("./constants");
// import { toTestingStatus } from '@grafana/runtime/utils/queryResponse';
const types_1 = require("../components/QueryEditor/types");
class SqlDatasource extends runtime_1.DataSourceWithBackend {
    constructor(instanceSettings, templateSrv = (0, runtime_1.getTemplateSrv)()) {
        super(instanceSettings);
        this.templateSrv = templateSrv;
        this.annotations = {};
        this.interpolateVariable = (value, variable) => {
            if (typeof value === 'string') {
                if (variable.multi || variable.includeAll) {
                    const result = this.getQueryModel().quoteLiteral(value);
                    return result;
                }
                else {
                    return value;
                }
            }
            if (typeof value === 'number') {
                return value;
            }
            if (Array.isArray(value)) {
                const quotedValues = value.map((v) => this.getQueryModel().quoteLiteral(v));
                return quotedValues.join(',');
            }
            return value;
        };
        this.name = instanceSettings.name;
        this.id = instanceSettings.id;
        const settingsData = instanceSettings.jsonData || {};
        this.interval = settingsData.timeInterval || '1m';
        this.db = this.getDB();
    }
    interpolateVariablesInQueries(queries, scopedVars) {
        let expandedQueries = queries;
        if (queries && queries.length > 0) {
            expandedQueries = queries.map((query) => {
                const expandedQuery = Object.assign(Object.assign({}, query), { datasource: this.getRef(), rawSql: this.templateSrv.replace(query.rawSql, scopedVars, this.interpolateVariable), rawQuery: true });
                return expandedQuery;
            });
        }
        return expandedQueries;
    }
    filterQuery(query) {
        return !query.hide;
    }
    applyTemplateVariables(target, scopedVars) {
        const queryModel = this.getQueryModel(target, this.templateSrv, scopedVars);
        const rawSql = this.clean(queryModel.interpolate());
        return {
            refId: target.refId,
            datasource: this.getRef(),
            rawSql,
            format: target.format,
        };
    }
    clean(value) {
        return value.replace(/''/g, "'");
    }
    metricFindQuery(query, optionalOptions) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const rawSql = this.templateSrv.replace(query, (0, exports.getSearchFilterScopedVar)({ query, wildcardChar: '%', options: optionalOptions }), this.interpolateVariable);
            const interpolatedQuery = {
                refId: 'tempvar',
                datasource: this.getRef(),
                rawSql,
                format: types_1.QueryFormat.Table,
            };
            const response = yield this.runMetaQuery(interpolatedQuery, optionalOptions);
            return this.getResponseParser().transformMetricFindResponse(response);
        });
    }
    runSql(query, options) {
        return tslib_1.__awaiter(this, void 0, void 0, function* () {
            const frame = yield this.runMetaQuery({ rawSql: query, format: types_1.QueryFormat.Table, refId: options === null || options === void 0 ? void 0 : options.refId }, options);
            return new data_1.DataFrameView(frame);
        });
    }
    runMetaQuery(request, options) {
        var _a, _b;
        const refId = request.refId || 'meta';
        const queries = [Object.assign(Object.assign({}, request), { datasource: request.datasource || this.getRef(), refId })];
        return (0, rxjs_1.lastValueFrom)((0, runtime_1.getBackendSrv)()
            .fetch({
            url: '/api/ds/query',
            method: 'POST',
            data: {
                from: (_a = options === null || options === void 0 ? void 0 : options.range) === null || _a === void 0 ? void 0 : _a.from.valueOf().toString(),
                to: (_b = options === null || options === void 0 ? void 0 : options.range) === null || _b === void 0 ? void 0 : _b.to.valueOf().toString(),
                queries,
            },
            requestId: refId,
        })
            .pipe((0, operators_1.map)((res) => {
            const rsp = (0, runtime_1.toDataQueryResponse)(res, queries);
            return rsp.data[0];
        })));
    }
    testDatasource() {
        return (0, rxjs_1.lastValueFrom)((0, runtime_1.getBackendSrv)()
            .fetch({
            url: '/api/ds/query',
            method: 'POST',
            data: {
                from: '5m',
                to: 'now',
                queries: [
                    {
                        refId: 'A',
                        intervalMs: 1,
                        maxDataPoints: 1,
                        datasource: this.getRef(),
                        datasourceId: this.id,
                        rawSql: 'SELECT 1',
                        format: 'table',
                    },
                ],
            },
        })
            .pipe((0, operators_1.map)(() => ({ status: 'success', message: 'Database Connection OK' })), (0, operators_1.catchError)((err) => {
            // return of(toTestingStatus(err));
            return (0, rxjs_1.of)(err);
        })));
    }
    targetContainsTemplate(target) {
        let queryWithoutMacros = target.rawSql;
        constants_1.MACRO_NAMES.forEach((value) => {
            queryWithoutMacros = (queryWithoutMacros === null || queryWithoutMacros === void 0 ? void 0 : queryWithoutMacros.replace(value, '')) || '';
        });
        return this.templateSrv.containsTemplate(queryWithoutMacros);
    }
}
exports.SqlDatasource = SqlDatasource;
exports.SEARCH_FILTER_VARIABLE = '__searchFilter';
const containsSearchFilter = (query) => query && typeof query === 'string' ? query.indexOf(exports.SEARCH_FILTER_VARIABLE) !== -1 : false;
exports.containsSearchFilter = containsSearchFilter;
const getSearchFilterScopedVar = (args) => {
    const { query, wildcardChar } = args;
    if (!(0, exports.containsSearchFilter)(query)) {
        return {};
    }
    let { options } = args;
    options = options || { searchFilter: '' };
    const value = options.searchFilter ? `${options.searchFilter}${wildcardChar}` : `${wildcardChar}`;
    return {
        __searchFilter: {
            value,
            text: '',
        },
    };
};
exports.getSearchFilterScopedVar = getSearchFilterScopedVar;
//# sourceMappingURL=SqlDatasource.js.map