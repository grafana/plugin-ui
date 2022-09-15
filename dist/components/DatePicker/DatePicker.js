"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatePicker = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const react_calendar_1 = tslib_1.__importDefault(require("react-calendar"));
const ui_1 = require("@grafana/ui");
const styles_1 = require("./styles");
exports.DatePicker = (0, react_1.memo)((props) => {
    const theme = (0, ui_1.useTheme2)();
    const styles = (0, styles_1.getStyles)(theme);
    const { isOpen, onClose } = props;
    if (!isOpen) {
        return null;
    }
    return (react_1.default.createElement(ui_1.ClickOutsideWrapper, { useCapture: true, includeButtonPress: false, onClick: onClose },
        react_1.default.createElement("div", { className: styles.modal, "data-testid": 'date-picker' },
            react_1.default.createElement(Body, Object.assign({}, props)))));
});
const Body = (0, react_1.memo)(({ value, onChange }) => {
    const theme = (0, ui_1.useTheme2)();
    const styles = (0, styles_1.getBodyStyles)(theme);
    return (react_1.default.createElement(react_calendar_1.default, { className: styles.body, tileClassName: styles.title, value: value || new Date(), nextLabel: react_1.default.createElement(ui_1.Icon, { name: 'angle-right' }), prevLabel: react_1.default.createElement(ui_1.Icon, { name: 'angle-left' }), onChange: (ev) => {
            if (!Array.isArray(ev)) {
                onChange(ev);
            }
        }, locale: 'en' }));
});
//# sourceMappingURL=DatePicker.js.map