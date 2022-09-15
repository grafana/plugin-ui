"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Segment = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const ui_1 = require("@grafana/ui");
const useDebounce_1 = require("../../hooks/useDebounce");
function Segment(props) {
    const { delay, onDebounce, value, options } = props, rest = tslib_1.__rest(props, ["delay", "onDebounce", "value", "options"]);
    const [input, setInput] = react_1.default.useState(value);
    const debouncedSegment = (0, useDebounce_1.useDebounce)(input, delay);
    (0, react_1.useEffect)(() => onDebounce(debouncedSegment), [debouncedSegment]);
    (0, react_1.useEffect)(() => setInput(value), [value]);
    return (react_1.default.createElement(ui_1.Segment, Object.assign({ options: options, onChange: (ev) => setInput(ev.value), value: input }, rest)));
}
exports.Segment = Segment;
;
//# sourceMappingURL=Segment.js.map