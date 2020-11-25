import { __extends } from "tslib";
import React, { PureComponent } from 'react';
var QueryEditorRow = /** @class */ (function (_super) {
    __extends(QueryEditorRow, _super);
    function QueryEditorRow(props) {
        var _this = _super.call(this, props) || this;
        _this.className = _this.props.className || 'width-8';
        return _this;
    }
    QueryEditorRow.prototype.render = function () {
        var label = this.props.label ? (React.createElement("label", { className: "gf-form-label query-keyword " + this.props.className }, this.props.label)) : (React.createElement("div", null));
        return (React.createElement("div", { style: { display: 'flex' } },
            React.createElement("div", { className: 'gf-form-inline' },
                label,
                this.props.children),
            React.createElement("div", { className: 'gf-form gf-form--grow' },
                React.createElement("div", { className: 'gf-form-label gf-form-label--grow' }))));
    };
    return QueryEditorRow;
}(PureComponent));
export { QueryEditorRow };
//# sourceMappingURL=QueryEditorRow.js.map