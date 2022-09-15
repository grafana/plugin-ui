"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccessoryButton = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const AccessoryButton = (_a) => {
    var { className } = _a, props = tslib_1.__rest(_a, ["className"]);
    const theme = (0, ui_1.useTheme2)();
    const styles = getButtonStyles(theme);
    return react_1.default.createElement(ui_1.Button, Object.assign({}, props, { className: (0, css_1.cx)(className, styles.button) }));
};
exports.AccessoryButton = AccessoryButton;
const getButtonStyles = (0, ui_1.stylesFactory)((theme) => ({
    button: (0, css_1.css)({
        paddingLeft: theme.spacing(3 / 2),
        paddingRight: theme.spacing(3 / 2),
    }),
}));
//# sourceMappingURL=AccessoryButton.js.map