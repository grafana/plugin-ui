import React from 'react';
;
export var QueryEditorRow = function (props) {
    var _a, _b;
    var className = (_a = props.className) !== null && _a !== void 0 ? _a : 'width-8';
    var noFillEnd = (_b = props.noFillEnd) !== null && _b !== void 0 ? _b : false;
    return (React.createElement("div", { className: 'gf-form' },
        props.label && (React.createElement("label", { className: "gf-form-label query-keyword " + className }, props.label)),
        props.children,
        React.createElement("div", { className: 'gf-form--grow' }, noFillEnd || (React.createElement("div", { className: 'gf-form-label gf-form-label--grow' })))));
};
//# sourceMappingURL=QueryEditorRow.js.map