"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InputGroup = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const InputGroup = ({ children }) => {
    const theme = (0, ui_1.useTheme2)();
    const styles = useStyles(theme);
    return react_1.default.createElement("div", { className: styles.root }, children);
};
exports.InputGroup = InputGroup;
const useStyles = (0, ui_1.stylesFactory)((theme) => ({
    root: (0, css_1.css)({
        display: 'flex',
        // Style the direct children of the component
        '> *': {
            '&:not(:first-child)': {
                // Negative margin hides the double-border on adjacent selects
                marginLeft: -1,
            },
            '&:first-child': {
                borderTopRightRadius: 0,
                borderBottomRightRadius: 0,
            },
            '&:last-child': {
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
            },
            '&:not(:first-child):not(:last-child)': {
                borderRadius: 0,
            },
            //
            position: 'relative',
            zIndex: 1,
            '&:hover': {
                zIndex: 2,
            },
            '&:focus-within': {
                zIndex: 2,
            },
        },
    }),
}));
//# sourceMappingURL=InputGroup.js.map