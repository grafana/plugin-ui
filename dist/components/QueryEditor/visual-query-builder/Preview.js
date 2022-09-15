"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Preview = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const react_use_1 = require("react-use");
const ui_1 = require("@grafana/ui");
const formatSQL_1 = require("../utils/formatSQL");
function Preview({ rawSql }) {
    // TODO: use zero index to give feedback about copy success
    const [_, copyToClipboard] = (0, react_use_1.useCopyToClipboard)();
    const styles = (0, ui_1.useStyles2)(getStyles);
    const labelElement = (react_1.default.createElement("div", { className: styles.labelWrapper },
        react_1.default.createElement("label", { className: styles.label }, "Preview"),
        react_1.default.createElement(ui_1.IconButton, { tooltip: "Copy to clipboard", onClick: () => copyToClipboard(rawSql), name: "copy" })));
    return (react_1.default.createElement(ui_1.Field, { label: labelElement, className: styles.grow },
        react_1.default.createElement(ui_1.CodeEditor, { language: "sql", height: 80, value: (0, formatSQL_1.formatSQL)(rawSql), monacoOptions: { scrollbar: { vertical: 'hidden' }, scrollBeyondLastLine: false }, readOnly: true, showMiniMap: false })));
}
exports.Preview = Preview;
function getStyles(theme) {
    return {
        grow: (0, css_1.css)({ flexGrow: 1 }),
        label: (0, css_1.css)({ fontSize: 12, fontWeight: theme.typography.fontWeightMedium }),
        labelWrapper: (0, css_1.css)({ display: 'flex', justifyContent: 'space-between', paddingBottom: theme.spacing(0.5) }),
    };
}
//# sourceMappingURL=Preview.js.map