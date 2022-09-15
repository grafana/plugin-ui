"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorSwitch = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const ui_1 = require("@grafana/ui");
const react_1 = tslib_1.__importDefault(require("react"));
// Wrapper component around <Switch /> that properly aligns it in <EditorField />
const EditorSwitch = (props) => {
    const styles = getStyles();
    return (react_1.default.createElement("div", { className: styles.switch },
        react_1.default.createElement(ui_1.Switch, Object.assign({}, props))));
};
exports.EditorSwitch = EditorSwitch;
const getStyles = () => {
    return {
        switch: (0, css_1.css)({
            display: 'flex',
            alignItems: 'center',
            minHeight: 30,
        }),
    };
};
//# sourceMappingURL=EditorSwitch.js.map