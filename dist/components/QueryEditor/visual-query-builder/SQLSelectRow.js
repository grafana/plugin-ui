"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLSelectRow = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const react_use_1 = require("react-use");
const data_1 = require("@grafana/data");
const SelectRow_1 = require("./SelectRow");
const useSqlChange_1 = require("../utils/useSqlChange");
function SQLSelectRow({ fields, query, onQueryChange, db }) {
    const { onSqlChange } = (0, useSqlChange_1.useSqlChange)({ query, onQueryChange, db });
    const state = (0, react_use_1.useAsync)(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const functions = yield db.functions();
        return functions.map((f) => (0, data_1.toOption)(f.name));
    }), [db]);
    return react_1.default.createElement(SelectRow_1.SelectRow, { columns: fields, sql: query.sql, functions: state.value, onSqlChange: onSqlChange });
}
exports.SQLSelectRow = SQLSelectRow;
//# sourceMappingURL=SQLSelectRow.js.map