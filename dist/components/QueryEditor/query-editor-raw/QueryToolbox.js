"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryToolbox = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importStar(require("react"));
const ui_1 = require("@grafana/ui");
const QueryValidator_1 = require("./QueryValidator");
function QueryToolbox(_a) {
    var { showTools, onFormatCode, onExpand, isExpanded } = _a, validatorProps = tslib_1.__rest(_a, ["showTools", "onFormatCode", "onExpand", "isExpanded"]);
    const theme = (0, ui_1.useTheme2)();
    const [validationResult, setValidationResult] = (0, react_1.useState)();
    const styles = (0, react_1.useMemo)(() => {
        return {
            container: (0, css_1.css) `
        border: 1px solid ${theme.colors.border.medium};
        border-top: none;
        padding: ${theme.spacing(0.5, 0.5, 0.5, 0.5)};
        display: flex;
        flex-grow: 1;
        justify-content: space-between;
        font-size: ${theme.typography.bodySmall.fontSize};
      `,
            error: (0, css_1.css) `
        color: ${theme.colors.error.text};
        font-size: ${theme.typography.bodySmall.fontSize};
        font-family: ${theme.typography.fontFamilyMonospace};
      `,
            valid: (0, css_1.css) `
        color: ${theme.colors.success.text};
      `,
            info: (0, css_1.css) `
        color: ${theme.colors.text.secondary};
      `,
            hint: (0, css_1.css) `
        color: ${theme.colors.text.disabled};
        white-space: nowrap;
        cursor: help;
      `,
        };
    }, [theme]);
    let style = {};
    if (!showTools && validationResult === undefined) {
        style = { height: 0, padding: 0, visibility: 'hidden' };
    }
    return (react_1.default.createElement("div", { className: styles.container, style: style },
        react_1.default.createElement("div", null, validatorProps.onValidate && (react_1.default.createElement(QueryValidator_1.QueryValidator, Object.assign({}, validatorProps, { onValidate: (result) => {
                setValidationResult(result);
                validatorProps.onValidate(result);
            } })))),
        showTools && (react_1.default.createElement("div", null,
            react_1.default.createElement(ui_1.HorizontalGroup, { spacing: "sm" },
                onFormatCode && (react_1.default.createElement(ui_1.IconButton, { onClick: onFormatCode, name: "brackets-curly", size: "xs", tooltip: "Format query" })),
                onExpand && (react_1.default.createElement(ui_1.IconButton, { onClick: () => onExpand(!isExpanded), name: isExpanded ? 'angle-up' : 'angle-down', size: "xs", tooltip: isExpanded ? 'Collapse editor' : 'Expand editor' })),
                react_1.default.createElement(ui_1.Tooltip, { content: "Hit CTRL/CMD+Return to run query" },
                    react_1.default.createElement(ui_1.Icon, { className: styles.hint, name: "keyboard" })))))));
}
exports.QueryToolbox = QueryToolbox;
//# sourceMappingURL=QueryToolbox.js.map