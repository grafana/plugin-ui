"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SQLWhereRow = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const useAsync_1 = tslib_1.__importDefault(require("react-use/lib/useAsync"));
const WhereRow_1 = require("./WhereRow");
const useSqlChange_1 = require("../utils/useSqlChange");
function SQLWhereRow({ query, fields, onQueryChange, db }) {
    const state = (0, useAsync_1.default)(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        return mapFieldsToTypes(fields);
    }), [fields]);
    const { onSqlChange } = (0, useSqlChange_1.useSqlChange)({ query, onQueryChange, db });
    return (react_1.default.createElement(WhereRow_1.WhereRow
    // TODO: fix key that's used to force clean render or SQLWhereRow - otherwise it doesn't render operators correctly
    , { 
        // TODO: fix key that's used to force clean render or SQLWhereRow - otherwise it doesn't render operators correctly
        key: JSON.stringify(state.value), config: { fields: state.value || {} }, sql: query.sql, onSqlChange: (val) => {
            onSqlChange(val);
        } }));
}
exports.SQLWhereRow = SQLWhereRow;
// needed for awesome query builder
function mapFieldsToTypes(columns) {
    const fields = {};
    for (const col of columns) {
        fields[col.value] = {
            type: col.raqbFieldType || 'text',
            valueSources: ['value'],
            mainWidgetProps: { customProps: { icon: col.icon } },
        };
    }
    return fields;
}
//# sourceMappingURL=SQLWhereRow.js.map