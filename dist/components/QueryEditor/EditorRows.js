"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorRows = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const Stack_1 = require("./Stack");
const EditorRows = ({ children }) => {
    return (react_1.default.createElement(Stack_1.Stack, { gap: 0.5, direction: "column" }, children));
};
exports.EditorRows = EditorRows;
//# sourceMappingURL=EditorRows.js.map