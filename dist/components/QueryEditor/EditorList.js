"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorList = void 0;
const tslib_1 = require("tslib");
const ui_1 = require("@grafana/ui");
const react_1 = tslib_1.__importDefault(require("react"));
const Stack_1 = require("./Stack");
function EditorList({ items, renderItem, onChange }) {
    const onAddItem = () => {
        const newItems = [...items, {}];
        onChange(newItems);
    };
    const onChangeItem = (itemIndex, newItem) => {
        const newItems = [...items];
        newItems[itemIndex] = newItem;
        onChange(newItems);
    };
    const onDeleteItem = (itemIndex) => {
        const newItems = [...items];
        newItems.splice(itemIndex, 1);
        onChange(newItems);
    };
    return (react_1.default.createElement(Stack_1.Stack, null,
        items.map((item, index) => (react_1.default.createElement("div", { key: index }, renderItem(item, (newItem) => onChangeItem(index, newItem), () => onDeleteItem(index))))),
        react_1.default.createElement(ui_1.Button, { onClick: onAddItem, variant: "secondary", size: "md", icon: "plus", "aria-label": "Add", type: "button" })));
}
exports.EditorList = EditorList;
//# sourceMappingURL=EditorList.js.map