"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatePickerWithInput = exports.formatDate = void 0;
const tslib_1 = require("tslib");
const ui_1 = require("@grafana/ui");
const react_1 = tslib_1.__importDefault(require("react"));
const DatePicker_1 = require("../DatePicker/DatePicker");
require("./style.css");
const formatDate = (date) => date.toISOString().split('T')[0];
exports.formatDate = formatDate;
const DatePickerWithInput = (props) => {
    const { value, onChange } = props, rest = tslib_1.__rest(props, ["value", "onChange"]);
    const [open, setOpen] = react_1.default.useState(false);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(ui_1.Input, Object.assign({ type: 'date', placeholder: 'Date', value: (0, exports.formatDate)(value || new Date()), onClick: () => setOpen(true), onChange: () => { } }, rest)),
        react_1.default.createElement(DatePicker_1.DatePicker, { isOpen: open, value: value, onChange: (ev) => onChange(ev), onClose: () => setOpen(false) })));
};
exports.DatePickerWithInput = DatePickerWithInput;
//# sourceMappingURL=DatePickerWithInput.js.map