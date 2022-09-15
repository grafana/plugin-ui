"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Space = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const Space = (props) => {
    const theme = (0, ui_1.useTheme2)();
    const styles = getStyles(theme, props);
    return react_1.default.createElement("span", { className: (0, css_1.cx)(styles.wrapper) });
};
exports.Space = Space;
exports.Space.defaultProps = {
    v: 0,
    h: 0,
    layout: 'block',
};
const getStyles = (0, ui_1.stylesFactory)((theme, props) => {
    var _a, _b;
    return ({
        wrapper: (0, css_1.css)([
            {
                paddingRight: theme.spacing((_a = props.h) !== null && _a !== void 0 ? _a : 0),
                paddingBottom: theme.spacing((_b = props.v) !== null && _b !== void 0 ? _b : 0),
            },
            props.layout === 'inline' && {
                display: 'inline-block',
            },
            props.layout === 'block' && {
                display: 'block',
            },
        ]),
    });
});
//# sourceMappingURL=Space.js.map