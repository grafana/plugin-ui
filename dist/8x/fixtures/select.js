"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectOption = exports.generateOptions = void 0;
const tslib_1 = require("tslib");
const react_1 = require("@testing-library/react");
const user_event_1 = tslib_1.__importDefault(require("@testing-library/user-event"));
const chance_1 = require("chance");
const lodash_1 = require("lodash");
const generateOptions = () => {
    const numberOfOptions = 5;
    return Array.from(new Array(numberOfOptions), () => {
        const name = (0, chance_1.Chance)().name();
        return {
            label: name,
            value: (0, lodash_1.kebabCase)(name),
        };
    });
};
exports.generateOptions = generateOptions;
/**
 * react-select (used by @grafana/ui) renders very differently from the native Select HTML element
 * and because they do not pass data-testid down, it is difficult to grab the
 * correct element and simulate selecting different options
 * created a helper function to click and select a different option manually
 * @param optionLabel
 * @param index If there are multiple inputs and you don't want the first one taken, then pass in the index
 */
const selectOption = (optionLabel, index, role) => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
    role = role || 'combobox';
    // this needs to be here to support autoFocus=true prop
    react_1.fireEvent.blur(react_1.screen.getAllByRole(role)[index || 0]);
    // open the dropdown
    react_1.fireEvent.keyDown(react_1.screen.getAllByRole(role)[index || 0], {
        key: 'ArrowDown',
        keyCode: 40,
    });
    // wait for the list to show
    const option = yield (0, react_1.waitFor)(() => react_1.screen.getByText(optionLabel));
    // select the option
    user_event_1.default.click(option);
});
exports.selectOption = selectOption;
//# sourceMappingURL=select.js.map