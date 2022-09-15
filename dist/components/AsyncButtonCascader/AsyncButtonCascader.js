"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsyncButtonCascader = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const css_1 = require("@emotion/css");
// @ts-ignore
const rc_cascader_1 = tslib_1.__importDefault(require("rc-cascader"));
const ui_2 = require("@grafana/ui");
const getStyles = ((theme) => {
    return {
        popup: (0, css_1.css) `
      label: popup;
      z-index: ${theme.zIndex.dropdown};
    `,
        icon: (0, css_1.css) `
      margin: 1px 0 0 4px;
    `,
    };
});
const AsyncButtonCascader = props => {
    const { onChange, className, loadData } = props, rest = tslib_1.__rest(props, ["onChange", "className", "loadData"]);
    const theme = (0, ui_2.useTheme2)();
    const styles = getStyles(theme);
    return (react_1.default.createElement(rc_cascader_1.default, Object.assign({ onChange: onChange, loadData: loadData, changeOnSelect: true, popupClassName: styles.popup }, rest, { expandIcon: null }),
        react_1.default.createElement("button", { className: (0, css_1.cx)('gf-form-label', className), disabled: props.disabled },
            props.children,
            " ",
            react_1.default.createElement(ui_1.Icon, { name: "angle-down", className: styles.icon }))));
};
exports.AsyncButtonCascader = AsyncButtonCascader;
exports.AsyncButtonCascader.displayName = 'AsyncButtonCascader';
//# sourceMappingURL=AsyncButtonCascader.js.map