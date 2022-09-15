"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupByRow = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const data_1 = require("@grafana/data");
const sql_utils_1 = require("../utils/sql.utils");
const EditorList_1 = require("../EditorList");
const ui_1 = require("@grafana/ui");
const AccessoryButton_1 = require("../AccessoryButton");
const InputGroup_1 = require("../InputGroup");
function GroupByRow({ sql, columns, onSqlChange }) {
    const onGroupByChange = (0, react_1.useCallback)((item) => {
        // As new (empty object) items come in, we need to make sure they have the correct type
        const cleaned = item.map((v) => { var _a; return (0, sql_utils_1.setGroupByField)((_a = v.property) === null || _a === void 0 ? void 0 : _a.name); });
        const newSql = Object.assign(Object.assign({}, sql), { groupBy: cleaned });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    return (react_1.default.createElement(EditorList_1.EditorList, { items: sql.groupBy, onChange: onGroupByChange, renderItem: makeRenderColumn({
            options: columns,
        }) }));
}
exports.GroupByRow = GroupByRow;
function makeRenderColumn({ options }) {
    const renderColumn = function (item, onChangeItem, onDeleteItem) {
        var _a;
        return (react_1.default.createElement(InputGroup_1.InputGroup, null,
            react_1.default.createElement(ui_1.Select, { value: ((_a = item.property) === null || _a === void 0 ? void 0 : _a.name) ? (0, data_1.toOption)(item.property.name) : null, "aria-label": "Group by", options: options, menuShouldPortal: true, onChange: ({ value }) => value && onChangeItem((0, sql_utils_1.setGroupByField)(value)) }),
            react_1.default.createElement(AccessoryButton_1.AccessoryButton, { "aria-label": "Remove group by column", icon: "times", variant: "secondary", onClick: onDeleteItem })));
    };
    return renderColumn;
}
//# sourceMappingURL=GroupByRow.js.map