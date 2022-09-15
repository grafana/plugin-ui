"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorField = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const Space_1 = require("../Space");
const EditorField = (props) => {
    const { label, optional, tooltip, children, width } = props, fieldProps = tslib_1.__rest(props, ["label", "optional", "tooltip", "children", "width"]);
    const theme = (0, ui_1.useTheme2)();
    const styles = getStyles(theme, width);
    // Null check for backward compatibility
    const childInputId = (fieldProps === null || fieldProps === void 0 ? void 0 : fieldProps.htmlFor) || (ui_1.ReactUtils === null || ui_1.ReactUtils === void 0 ? void 0 : ui_1.ReactUtils.getChildId(children));
    const labelEl = (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement("label", { className: styles.label, htmlFor: childInputId },
            label,
            optional && react_1.default.createElement("span", { className: styles.optional }, " - optional"),
            tooltip && (react_1.default.createElement(ui_1.Tooltip, { placement: "top", content: tooltip, theme: "info" },
                react_1.default.createElement(ui_1.Icon, { name: "info-circle", size: "sm", className: styles.icon })))),
        react_1.default.createElement(Space_1.Space, { v: 0.5 })));
    return (react_1.default.createElement("div", { className: styles.root },
        react_1.default.createElement(ui_1.Field, Object.assign({ className: styles.field, label: labelEl }, fieldProps), children)));
};
exports.EditorField = EditorField;
const getStyles = (0, ui_1.stylesFactory)((theme, width) => {
    return {
        root: (0, css_1.css)({
            minWidth: theme.spacing(width !== null && width !== void 0 ? width : 0),
        }),
        label: (0, css_1.css)({
            fontSize: 12,
            fontWeight: theme.typography.fontWeightMedium,
        }),
        optional: (0, css_1.css)({
            fontStyle: 'italic',
            color: theme.colors.text.secondary,
        }),
        field: (0, css_1.css)({
            marginBottom: 0, // GrafanaUI/Field has a bottom margin which we must remove
        }),
        icon: (0, css_1.css)({
            color: theme.colors.text.secondary,
            marginLeft: theme.spacing(1),
            ':hover': {
                color: theme.colors.text.primary,
            },
        }),
    };
});
//# sourceMappingURL=EditorField.js.map