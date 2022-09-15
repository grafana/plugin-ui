"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderByRow = void 0;
const tslib_1 = require("tslib");
const lodash_1 = require("lodash");
const react_1 = tslib_1.__importStar(require("react"));
const data_1 = require("@grafana/data");
const ui_1 = require("@grafana/ui");
const sql_utils_1 = require("../utils/sql.utils");
const Space_1 = require("../Space");
const EditorField_1 = require("../EditorField");
const InputGroup_1 = require("../InputGroup");
const sortOrderOptions = [
    { description: 'Sort by ascending', value: 'ASC', icon: 'sort-amount-up' },
    { description: 'Sort by descending', value: 'DESC', icon: 'sort-amount-down' },
];
function OrderByRow({ sql, onSqlChange, columns, showOffset }) {
    var _a, _b;
    const onSortOrderChange = (0, react_1.useCallback)((item) => {
        const newSql = Object.assign(Object.assign({}, sql), { orderByDirection: item });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    const onLimitChange = (0, react_1.useCallback)((event) => {
        const newSql = Object.assign(Object.assign({}, sql), { limit: Number.parseInt(event.currentTarget.value, 10) });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    const onOffsetChange = (0, react_1.useCallback)((event) => {
        const newSql = Object.assign(Object.assign({}, sql), { offset: Number.parseInt(event.currentTarget.value, 10) });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    const onOrderByChange = (0, react_1.useCallback)((item) => {
        const newSql = Object.assign(Object.assign({}, sql), { orderBy: (0, sql_utils_1.setPropertyField)(item === null || item === void 0 ? void 0 : item.value) });
        if (item === null) {
            newSql.orderByDirection = undefined;
        }
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(EditorField_1.EditorField, { label: "Order by", width: 25 },
            react_1.default.createElement(InputGroup_1.InputGroup, null,
                react_1.default.createElement(ui_1.Select, { "aria-label": "Order by", options: columns, value: ((_a = sql.orderBy) === null || _a === void 0 ? void 0 : _a.property.name) ? (0, data_1.toOption)(sql.orderBy.property.name) : null, isClearable: true, menuShouldPortal: true, onChange: onOrderByChange }),
                react_1.default.createElement(Space_1.Space, { h: 1.5 }),
                react_1.default.createElement(ui_1.RadioButtonGroup, { options: sortOrderOptions, disabled: !((_b = sql === null || sql === void 0 ? void 0 : sql.orderBy) === null || _b === void 0 ? void 0 : _b.property.name), value: sql.orderByDirection, onChange: onSortOrderChange }))),
        react_1.default.createElement(EditorField_1.EditorField, { label: "Limit", optional: true, width: 25 },
            react_1.default.createElement(ui_1.Input, { type: "number", min: 0, id: (0, lodash_1.uniqueId)('limit-'), value: sql.limit || '', onChange: onLimitChange })),
        showOffset && (react_1.default.createElement(EditorField_1.EditorField, { label: "Offset", optional: true, width: 25 },
            react_1.default.createElement(ui_1.Input, { type: "number", id: (0, lodash_1.uniqueId)('offset-'), value: sql.offset || '', onChange: onOffsetChange })))));
}
exports.OrderByRow = OrderByRow;
//# sourceMappingURL=OrderByRow.js.map