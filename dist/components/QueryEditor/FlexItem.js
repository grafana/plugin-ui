"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FlexItem = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const FlexItem = ({ grow, shrink }) => {
    return react_1.default.createElement("div", { style: { display: 'block', flexGrow: grow, flexShrink: shrink } });
};
exports.FlexItem = FlexItem;
//# sourceMappingURL=FlexItem.js.map