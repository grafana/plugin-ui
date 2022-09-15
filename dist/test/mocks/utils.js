"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectOption = exports.openSelect = exports.generateArrayOf = exports.undefinedOr = exports.generateBoolean = void 0;
const tslib_1 = require("tslib");
const chance_1 = require("chance");
const react_1 = require("@testing-library/react");
const user_event_1 = tslib_1.__importDefault(require("@testing-library/user-event"));
const generateBoolean = () => (0, chance_1.Chance)().pickone([true, false]);
exports.generateBoolean = generateBoolean;
const undefinedOr = (fn) => (0, chance_1.Chance)().pickone([undefined, fn()]);
exports.undefinedOr = undefinedOr;
const generateArrayOf = (fn, numberOf = 3) => Array.from(new Array(numberOf), () => fn());
exports.generateArrayOf = generateArrayOf;
// react-select (used by @grafana/ui) renders very differently from the native Select HTML element
// and because they are not accessible and do not pass data-testid or aria-labels down,
// it is difficult to grab the correct element and simulate selecting different options
// the helper functions below can be used instead
/**
 * Opens a Select or MultiSelect dropdown
 *
 * @param {HTMLElement} container The container wrapping the Select or MultiSelect component
 * @param {string} optionLabel The option text we want to type or search
 */
const openSelect = (container, optionLabel) => {
    const selectInput = (0, react_1.within)(container).getByRole('textbox');
    // this needs to be here to support autoFocus=true prop
    react_1.fireEvent.blur(selectInput);
    // if we have an async Select, we want to type the option label to make the option available
    // otherwise, just press down to open the dropdown
    user_event_1.default.type(selectInput, optionLabel !== null && optionLabel !== void 0 ? optionLabel : '{arrowdown}');
};
exports.openSelect = openSelect;
/**
 * Selects an option from the Select or MultiSelect component
 *
 * @param {HTMLElement} container The container wrapping the Select or MultiSelect component
 * @param {string} optionLabel The option we want to select
 * @param {boolean} [typeOptionLabel=false] If we should type the optional label after opening - this is useful for AsyncSelect
 */
const selectOption = (container, optionLabel, typeOptionLabel) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    (0, exports.openSelect)(container, typeOptionLabel ? optionLabel : undefined);
    // wait for the list to show
    const option = yield (0, react_1.waitFor)(() => (0, react_1.within)(container).getByText(optionLabel));
    // select the option
    user_event_1.default.click(option);
});
exports.selectOption = selectOption;
//# sourceMappingURL=utils.js.map