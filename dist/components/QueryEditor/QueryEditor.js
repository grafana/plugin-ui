"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlQueryEditor = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const react_use_1 = require("react-use");
const defaults_1 = require("./defaults");
const types_1 = require("./types");
const sql_utils_1 = require("./utils/sql.utils");
const QueryHeader_1 = require("./QueryHeader");
const RawEditor_1 = require("./query-editor-raw/RawEditor");
const VisualEditor_1 = require("./visual-query-builder/VisualEditor");
const Space_1 = require("./Space");
function SqlQueryEditor({ datasource, query, onChange, onRunQuery, range }) {
    var _a, _b, _c, _d, _e, _f;
    const [isQueryRunnable, setIsQueryRunnable] = (0, react_1.useState)(true);
    const db = datasource.getDB();
    const { loading, error } = (0, react_use_1.useAsync)(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        return () => {
            if (datasource.getDB(datasource.id).init !== undefined) {
                datasource.getDB(datasource.id).init();
            }
        };
    }), [datasource]);
    const queryWithDefaults = (0, defaults_1.applyQueryDefaults)(query);
    const [queryRowFilter, setQueryRowFilter] = (0, react_1.useState)({
        filter: !!((_a = queryWithDefaults.sql) === null || _a === void 0 ? void 0 : _a.whereString),
        group: !!((_d = (_c = (_b = queryWithDefaults.sql) === null || _b === void 0 ? void 0 : _b.groupBy) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.property.name),
        order: !!((_f = (_e = queryWithDefaults.sql) === null || _e === void 0 ? void 0 : _e.orderBy) === null || _f === void 0 ? void 0 : _f.property.name),
        preview: true,
    });
    const [queryToValidate, setQueryToValidate] = (0, react_1.useState)(queryWithDefaults);
    (0, react_1.useEffect)(() => {
        return () => {
            if (datasource.getDB(datasource.id).dispose !== undefined) {
                datasource.getDB(datasource.id).dispose();
            }
        };
    }, [datasource]);
    const processQuery = (0, react_1.useCallback)((q) => {
        if (isQueryValid(q) && onRunQuery) {
            onRunQuery();
        }
    }, [onRunQuery]);
    const onQueryChange = (q, process = true) => {
        var _a, _b;
        setQueryToValidate(q);
        onChange(q);
        if ((0, sql_utils_1.haveColumns)((_a = q.sql) === null || _a === void 0 ? void 0 : _a.columns) && ((_b = q.sql) === null || _b === void 0 ? void 0 : _b.columns.some((c) => c.name)) && !queryRowFilter.group) {
            setQueryRowFilter(Object.assign(Object.assign({}, queryRowFilter), { group: true }));
        }
        if (process) {
            processQuery(q);
        }
    };
    const onQueryHeaderChange = (q) => {
        setQueryToValidate(q);
        onChange(q);
    };
    if (loading || error) {
        return null;
    }
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(QueryHeader_1.QueryHeader, { db: db, onChange: onQueryHeaderChange, onRunQuery: onRunQuery, onQueryRowChange: setQueryRowFilter, queryRowFilter: queryRowFilter, query: queryWithDefaults, isQueryRunnable: isQueryRunnable, labels: datasource.getDB(datasource.id).labels }),
        react_1.default.createElement(Space_1.Space, { v: 0.5 }),
        queryWithDefaults.editorMode !== types_1.EditorMode.Code && (react_1.default.createElement(VisualEditor_1.VisualEditor, { db: db, query: queryWithDefaults, onChange: (q) => onQueryChange(q, false), queryRowFilter: queryRowFilter, onValidate: setIsQueryRunnable, range: range })),
        queryWithDefaults.editorMode === types_1.EditorMode.Code && (react_1.default.createElement(RawEditor_1.RawEditor, { db: db, query: queryWithDefaults, queryToValidate: queryToValidate, onChange: onQueryChange, onRunQuery: onRunQuery, onValidate: setIsQueryRunnable, range: range }))));
}
exports.SqlQueryEditor = SqlQueryEditor;
const isQueryValid = (q) => {
    return Boolean(q.rawSql);
};
//# sourceMappingURL=QueryEditor.js.map