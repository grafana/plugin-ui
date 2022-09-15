"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLGroupByRow = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const GroupByRow_1 = require("./GroupByRow");
const useSqlChange_1 = require("../utils/useSqlChange");
function SQLGroupByRow({ fields, query, onQueryChange, db }) {
    const { onSqlChange } = (0, useSqlChange_1.useSqlChange)({ query, onQueryChange, db });
    return react_1.default.createElement(GroupByRow_1.GroupByRow, { columns: fields, sql: query.sql, onSqlChange: onSqlChange });
}
exports.SQLGroupByRow = SQLGroupByRow;
//# sourceMappingURL=SQLGroupByRow.js.map