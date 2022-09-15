"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EditorRow = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const Stack_1 = require("./Stack");
const ui_1 = require("@grafana/ui");
const EditorRow = ({ children }) => {
    const styles = (0, ui_1.useStyles2)(getStyles);
    return (react_1.default.createElement("div", { className: styles.root },
        react_1.default.createElement(Stack_1.Stack, { gap: 2 }, children)));
};
exports.EditorRow = EditorRow;
const getStyles = (theme) => {
    return {
        root: (0, css_1.css)({
            padding: theme.spacing(1),
            backgroundColor: theme.colors.background.secondary,
            borderRadius: theme.shape.borderRadius(1),
        }),
    };
};
//# sourceMappingURL=EditorRow.js.map