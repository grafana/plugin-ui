"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorHeader = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const EditorHeader = ({ children }) => {
    const theme = (0, ui_1.useTheme2)();
    const styles = getStyles(theme);
    return react_1.default.createElement("div", { className: styles.root }, children);
};
exports.EditorHeader = EditorHeader;
const getStyles = (0, ui_1.stylesFactory)((theme) => ({
    root: (0, css_1.css)({
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: theme.spacing(3),
        minHeight: theme.spacing(4),
    }),
}));
//# sourceMappingURL=EditorHeader.js.map