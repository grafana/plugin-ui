"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InlineSelect = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importStar(require("react"));
const ui_1 = require("@grafana/ui");
function InlineSelect(_a) {
    var { label: labelProp } = _a, props = tslib_1.__rest(_a, ["label"]);
    const theme = (0, ui_1.useTheme2)();
    const [id] = (0, react_1.useState)(() => Math.random().toString(16).slice(2));
    const styles = getSelectStyles(theme);
    const components = {
        SelectContainer,
        ValueContainer,
        SingleValue: ValueContainer,
    };
    return (react_1.default.createElement("div", { className: styles.root },
        labelProp && (react_1.default.createElement("label", { className: styles.label, htmlFor: id },
            labelProp,
            ':',
            "\u00A0")),
        react_1.default.createElement(Select, Object.assign({ openMenuOnFocus: true, inputId: id }, props, { components: components }))));
}
exports.InlineSelect = InlineSelect;
const SelectContainer = (props) => {
    const { children } = props;
    const theme = (0, ui_1.useTheme2)();
    const styles = getSelectStyles(theme);
    return (react_1.default.createElement(ui_1.SelectContainer, Object.assign({}, props, { className: (0, css_1.cx)(props.className, styles.container) }), children));
};
const ValueContainer = (props) => {
    const { className, children } = props;
    const theme = (0, ui_1.useTheme2)();
    const styles = getSelectStyles(theme);
    return react_1.default.createElement("div", { className: (0, css_1.cx)(className, styles.valueContainer) }, children);
};
const getSelectStyles = (0, ui_1.stylesFactory)((theme) => ({
    root: (0, css_1.css)({
        display: 'flex',
        fontSize: 12,
        alignItems: 'center',
    }),
    label: (0, css_1.css)({
        color: theme.colors.text.secondary,
        whiteSpace: 'nowrap',
    }),
    container: (0, css_1.css)({
        background: 'none',
        borderColor: 'transparent',
    }),
    valueContainer: (0, css_1.css)({
        display: 'flex',
        alignItems: 'center',
        flex: 'initial',
        color: theme.colors.text.secondary,
        fontSize: 12,
    }),
}));
//# sourceMappingURL=InlineSelect.js.map