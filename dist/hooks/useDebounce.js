"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDebounce = exports.DEFAULT_DELAY = void 0;
const react_1 = require("react");
exports.DEFAULT_DELAY = 275;
const useDebounce = (value, delay = exports.DEFAULT_DELAY) => {
    const [debouncedValue, setDebouncedValue] = (0, react_1.useState)(value);
    (0, react_1.useEffect)(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value]);
    return debouncedValue;
};
exports.useDebounce = useDebounce;
//# sourceMappingURL=useDebounce.js.map