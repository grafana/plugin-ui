"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatasetSelector = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const react_use_1 = require("react-use");
const ui_1 = require("@grafana/ui");
const types_1 = require("./types");
const DatasetSelector = ({ db, value, onChange, disabled, className, applyDefault, }) => {
    const state = (0, react_use_1.useAsync)(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const datasets = yield db.datasets();
        return datasets.map(types_1.toOption);
    }), []);
    (0, react_1.useEffect)(() => {
        if (!applyDefault) {
            return;
        }
        // Set default dataset when values are fetched
        if (!value) {
            if (state.value && state.value[0]) {
                onChange(state.value[0]);
            }
        }
        else {
            if (state.value && state.value.find((v) => v.value === value) === undefined) {
                // if value is set and newly fetched values does not contain selected value
                if (state.value.length > 0) {
                    onChange(state.value[0]);
                }
            }
        }
    }, [state.value, value, applyDefault, onChange]);
    return (react_1.default.createElement(ui_1.Select, { className: className, "aria-label": "Dataset selector", value: value, options: state.value, onChange: onChange, disabled: disabled, isLoading: state.loading, menuShouldPortal: true }));
};
exports.DatasetSelector = DatasetSelector;
//# sourceMappingURL=DatasetSelector.js.map