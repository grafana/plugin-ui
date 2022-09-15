"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLOrderByRow = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const OrderByRow_1 = require("./OrderByRow");
const useSqlChange_1 = require("../utils/useSqlChange");
function SQLOrderByRow({ fields, query, onQueryChange, db }) {
    var _a, _b;
    const { onSqlChange } = (0, useSqlChange_1.useSqlChange)({ query, onQueryChange, db });
    let columnsWithIndices = [];
    if (fields) {
        const options = (_b = (_a = query.sql) === null || _a === void 0 ? void 0 : _a.columns) === null || _b === void 0 ? void 0 : _b.map((c, i) => {
            var _a, _b;
            const value = c.name ? `${c.name}(${(_a = c.parameters) === null || _a === void 0 ? void 0 : _a.map((p) => p.name)})` : (_b = c.parameters) === null || _b === void 0 ? void 0 : _b.map((p) => p.name);
            return {
                value,
                label: `${i + 1} - ${value}`,
            };
        });
        columnsWithIndices = [
            {
                value: '',
                label: 'Selected columns',
                options,
                expanded: true,
            },
            ...fields,
        ];
    }
    return react_1.default.createElement(OrderByRow_1.OrderByRow, { sql: query.sql, onSqlChange: onSqlChange, columns: columnsWithIndices });
}
exports.SQLOrderByRow = SQLOrderByRow;
//# sourceMappingURL=SQLOrderByRow.js.map