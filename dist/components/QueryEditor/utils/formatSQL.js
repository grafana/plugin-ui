"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatSQL = void 0;
const tslib_1 = require("tslib");
// @ts-ignore
const sql_formatter_plus_1 = tslib_1.__importDefault(require("sql-formatter-plus"));
function formatSQL(q) {
    return sql_formatter_plus_1.default.format(q).replace(/(\$ \{ .* \})|(\$ __)|(\$ \w+)/g, (m) => {
        return m.replace(/\s/g, '');
    });
}
exports.formatSQL = formatSQL;
//# sourceMappingURL=formatSQL.js.map