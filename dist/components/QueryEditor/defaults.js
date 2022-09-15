"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyQueryDefaults = void 0;
const types_1 = require("./types");
const sql_utils_1 = require("./utils/sql.utils");
function applyQueryDefaults(q) {
    let editorMode = (q === null || q === void 0 ? void 0 : q.editorMode) || types_1.EditorMode.Builder;
    // Switching to code editor if the query was created before visual query builder was introduced.
    if ((q === null || q === void 0 ? void 0 : q.editorMode) === undefined && (q === null || q === void 0 ? void 0 : q.rawSql) !== undefined) {
        editorMode = types_1.EditorMode.Code;
    }
    const result = Object.assign(Object.assign({}, q), { refId: (q === null || q === void 0 ? void 0 : q.refId) || 'A', format: (q === null || q === void 0 ? void 0 : q.format) !== undefined ? q.format : types_1.QueryFormat.Table, rawSql: (q === null || q === void 0 ? void 0 : q.rawSql) || '', editorMode, sql: (q === null || q === void 0 ? void 0 : q.sql) || {
            columns: [(0, sql_utils_1.createFunctionField)()],
            groupBy: [(0, sql_utils_1.setGroupByField)()],
            limit: 50,
        } });
    return result;
}
exports.applyQueryDefaults = applyQueryDefaults;
//# sourceMappingURL=defaults.js.map