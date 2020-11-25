import { __assign, __makeTemplateObject, __rest } from "tslib";
import React from 'react';
import { Icon } from '@grafana/ui';
import { css, cx } from 'emotion';
// @ts-ignore
import RCCascader from 'rc-cascader';
import { stylesFactory, useTheme } from '@grafana/ui';
var getStyles = stylesFactory(function (theme) {
    return {
        popup: css(templateObject_1 || (templateObject_1 = __makeTemplateObject(["\n      label: popup;\n      z-index: ", ";\n    "], ["\n      label: popup;\n      z-index: ", ";\n    "])), theme.zIndex.dropdown),
        icon: css(templateObject_2 || (templateObject_2 = __makeTemplateObject(["\n      margin: 1px 0 0 4px;\n    "], ["\n      margin: 1px 0 0 4px;\n    "]))),
    };
});
export var AsyncButtonCascader = function (props) {
    var onChange = props.onChange, className = props.className, loadData = props.loadData, rest = __rest(props, ["onChange", "className", "loadData"]);
    var theme = useTheme();
    var styles = getStyles(theme);
    return (React.createElement(RCCascader, __assign({ onChange: onChange, loadData: loadData, changeOnSelect: true, popupClassName: styles.popup }, rest, { expandIcon: null }),
        React.createElement("button", { className: cx('gf-form-label', className), disabled: props.disabled },
            props.children,
            " ",
            React.createElement(Icon, { name: "angle-down", className: styles.icon }))));
};
AsyncButtonCascader.displayName = 'AsyncButtonCascader';
var templateObject_1, templateObject_2;
//# sourceMappingURL=AsyncButtonCascader.js.map