"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SelectRow = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const lodash_1 = require("lodash");
const react_1 = tslib_1.__importStar(require("react"));
const data_1 = require("@grafana/data");
const ui_1 = require("@grafana/ui");
const EditorField_1 = require("../EditorField");
const expressions_1 = require("../expressions");
const sql_utils_1 = require("../utils/sql.utils");
const Stack_1 = require("../Stack");
const asteriskValue = { label: '*', value: '*' };
function SelectRow({ sql, columns, onSqlChange, functions }) {
    var _a;
    const styles = (0, ui_1.useStyles2)(getStyles);
    const columnsWithAsterisk = [asteriskValue, ...(columns || [])];
    const onColumnChange = (0, react_1.useCallback)((item, index) => (column) => {
        var _a, _b;
        let modifiedItem = Object.assign({}, item);
        if (!((_a = item.parameters) === null || _a === void 0 ? void 0 : _a.length)) {
            modifiedItem.parameters = [{ type: expressions_1.QueryEditorExpressionType.FunctionParameter, name: column.value }];
        }
        else {
            modifiedItem.parameters = item.parameters.map((p) => p.type === expressions_1.QueryEditorExpressionType.FunctionParameter ? Object.assign(Object.assign({}, p), { name: column.value }) : p);
        }
        const newSql = Object.assign(Object.assign({}, sql), { columns: (_b = sql.columns) === null || _b === void 0 ? void 0 : _b.map((c, i) => (i === index ? modifiedItem : c)) });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    const onAggregationChange = (0, react_1.useCallback)((item, index) => (aggregation) => {
        var _a;
        const newItem = Object.assign(Object.assign({}, item), { name: aggregation === null || aggregation === void 0 ? void 0 : aggregation.value });
        const newSql = Object.assign(Object.assign({}, sql), { columns: (_a = sql.columns) === null || _a === void 0 ? void 0 : _a.map((c, i) => (i === index ? newItem : c)) });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    const removeColumn = (0, react_1.useCallback)((index) => () => {
        const clone = [...sql.columns];
        clone.splice(index, 1);
        const newSql = Object.assign(Object.assign({}, sql), { columns: clone });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    const addColumn = (0, react_1.useCallback)(() => {
        const newSql = Object.assign(Object.assign({}, sql), { columns: [...sql.columns, (0, sql_utils_1.createFunctionField)()] });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    return (react_1.default.createElement(Stack_1.Stack, { gap: 2, alignItems: "end", wrap: true, direction: "column" }, (_a = sql.columns) === null || _a === void 0 ? void 0 :
        _a.map((item, index) => (react_1.default.createElement("div", { key: index },
            react_1.default.createElement(Stack_1.Stack, { gap: 2, alignItems: "end" },
                react_1.default.createElement(EditorField_1.EditorField, { label: "Column", width: 25 },
                    react_1.default.createElement(ui_1.Select, { value: getColumnValue(item), options: columnsWithAsterisk, inputId: `select-column-${index}-${(0, lodash_1.uniqueId)()}`, menuShouldPortal: true, allowCustomValue: true, onChange: onColumnChange(item, index) })),
                react_1.default.createElement(EditorField_1.EditorField, { label: "Aggregation", optional: true, width: 25 },
                    react_1.default.createElement(ui_1.Select, { value: item.name ? (0, data_1.toOption)(item.name) : null, inputId: `select-aggregation-${index}-${(0, lodash_1.uniqueId)()}`, isClearable: true, menuShouldPortal: true, allowCustomValue: true, options: functions, onChange: onAggregationChange(item, index) })),
                react_1.default.createElement(ui_1.Button, { "aria-label": "Remove", type: "button", icon: "trash-alt", variant: "secondary", size: "md", onClick: removeColumn(index) }))))),
        react_1.default.createElement(ui_1.Button, { type: "button", onClick: addColumn, variant: "secondary", size: "md", icon: "plus", "aria-label": "Add", className: styles.addButton })));
}
exports.SelectRow = SelectRow;
const getStyles = () => {
    return { addButton: (0, css_1.css)({ alignSelf: 'flex-start' }) };
};
function getColumnValue({ parameters }) {
    const column = parameters === null || parameters === void 0 ? void 0 : parameters.find((p) => p.type === expressions_1.QueryEditorExpressionType.FunctionParameter);
    if (column === null || column === void 0 ? void 0 : column.name) {
        return (0, data_1.toOption)(column.name);
    }
    return null;
}
//# sourceMappingURL=SelectRow.js.map