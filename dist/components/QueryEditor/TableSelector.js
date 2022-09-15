"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TableSelector = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const react_use_1 = require("react-use");
const data_1 = require("@grafana/data");
const ui_1 = require("@grafana/ui");
const TableSelector = ({ db, query, value, className, onChange }) => {
    const state = (0, react_use_1.useAsync)(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        if (!query.dataset) {
            return [];
        }
        const tables = yield db.tables(query.dataset);
        return tables.map(data_1.toOption);
    }), [query.dataset]);
    return (react_1.default.createElement(ui_1.Select, { className: className, disabled: state.loading, "aria-label": "Table selector", value: value, options: state.value, onChange: onChange, isLoading: state.loading, menuShouldPortal: true, placeholder: state.loading ? 'Loading tables' : 'Select table' }));
};
exports.TableSelector = TableSelector;
//# sourceMappingURL=TableSelector.js.map