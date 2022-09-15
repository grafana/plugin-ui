"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const Stack = (_a) => {
    var { children } = _a, props = tslib_1.__rest(_a, ["children"]);
    const theme = (0, ui_1.useTheme2)();
    const styles = useStyles(theme, props);
    return react_1.default.createElement("div", { className: styles.root }, children);
};
exports.Stack = Stack;
const useStyles = (0, ui_1.stylesFactory)((theme, props) => {
    var _a, _b, _c;
    return ({
        root: (0, css_1.css)({
            display: 'flex',
            flexDirection: (_a = props.direction) !== null && _a !== void 0 ? _a : 'row',
            flexWrap: ((_b = props.wrap) !== null && _b !== void 0 ? _b : true) ? 'wrap' : undefined,
            alignItems: props.alignItems,
            gap: theme.spacing((_c = props.gap) !== null && _c !== void 0 ? _c : 2),
        }),
    });
});
//# sourceMappingURL=Stack.js.map