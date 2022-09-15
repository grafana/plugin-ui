"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryEditorRow = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
;
const QueryEditorRow = (props) => {
    var _a, _b;
    const className = (_a = props.className) !== null && _a !== void 0 ? _a : 'width-8';
    const noFillEnd = (_b = props.noFillEnd) !== null && _b !== void 0 ? _b : false;
    return (react_1.default.createElement("div", { className: 'gf-form' },
        props.label && (react_1.default.createElement("label", { className: `gf-form-label query-keyword ${className}` }, props.label)),
        props.children,
        react_1.default.createElement("div", { className: 'gf-form--grow' }, noFillEnd || (react_1.default.createElement("div", { className: 'gf-form-label gf-form-label--grow' })))));
};
exports.QueryEditorRow = QueryEditorRow;
//# sourceMappingURL=QueryEditorRow.js.map