"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebounceInput = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const ui_1 = require("@grafana/ui");
const useDebounce_1 = require("../../hooks/useDebounce");
const DebounceInput = (props) => {
    const { delay, onDebounce, value } = props, rest = tslib_1.__rest(props, ["delay", "onDebounce", "value"]);
    const [input, setInput] = react_1.default.useState(value);
    const debouncedInput = (0, useDebounce_1.useDebounce)(input, delay);
    react_1.default.useEffect(() => onDebounce(debouncedInput), [debouncedInput]);
    react_1.default.useEffect(() => setInput(value), [value]);
    return (react_1.default.createElement(ui_1.Input, Object.assign({ onChange: (ev) => setInput(ev.currentTarget.value), value: input }, rest)));
};
exports.DebounceInput = DebounceInput;
//# sourceMappingURL=DebounceInput.js.map