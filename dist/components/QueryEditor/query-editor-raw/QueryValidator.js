"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryValidator = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importStar(require("react"));
const react_use_1 = require("react-use");
const useDebounce_1 = tslib_1.__importDefault(require("react-use/lib/useDebounce"));
const data_1 = require("@grafana/data");
const ui_1 = require("@grafana/ui");
function QueryValidator({ db, query, onValidate, range }) {
    var _a;
    const [validationResult, setValidationResult] = (0, react_1.useState)();
    const theme = (0, ui_1.useTheme2)();
    const valueFormatter = (0, react_1.useMemo)(() => (0, data_1.getValueFormat)('bytes'), []);
    const styles = (0, react_1.useMemo)(() => {
        return {
            error: (0, css_1.css) `
        color: ${theme.colors.error.text};
        font-size: ${theme.typography.bodySmall.fontSize};
        font-family: ${theme.typography.fontFamilyMonospace};
      `,
            valid: (0, css_1.css) `
        color: ${theme.colors.success.text};
      `,
            info: (0, css_1.css) `
        color: ${theme.colors.text.secondary};
      `,
        };
    }, [theme]);
    const [state, validateQuery] = (0, react_use_1.useAsyncFn)((q) => tslib_1.__awaiter(this, void 0, void 0, function* () {
        var _b;
        if (((_b = q.rawSql) === null || _b === void 0 ? void 0 : _b.trim()) === '') {
            return null;
        }
        return yield db.validateQuery(q, range);
    }), [db]);
    const [,] = (0, useDebounce_1.default)(() => tslib_1.__awaiter(this, void 0, void 0, function* () {
        const result = yield validateQuery(query);
        if (result) {
            setValidationResult(result);
        }
        return null;
    }), 1000, [query, validateQuery]);
    (0, react_1.useEffect)(() => {
        if (validationResult === null || validationResult === void 0 ? void 0 : validationResult.isError) {
            onValidate(false);
        }
        if (validationResult === null || validationResult === void 0 ? void 0 : validationResult.isValid) {
            onValidate(true);
        }
    }, [validationResult, onValidate]);
    if (!state.value && !state.loading) {
        return null;
    }
    const error = ((_a = state.value) === null || _a === void 0 ? void 0 : _a.error) ? processErrorMessage(state.value.error) : '';
    return (react_1.default.createElement(react_1.default.Fragment, null,
        state.loading && (react_1.default.createElement("div", { className: styles.info },
            react_1.default.createElement(ui_1.Spinner, { inline: true, size: 12 }),
            " Validating query...")),
        !state.loading && state.value && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(react_1.default.Fragment, null, state.value.isValid && state.value.statistics && (react_1.default.createElement("div", { className: styles.valid },
                react_1.default.createElement(ui_1.Icon, { name: "check" }),
                " This query will process",
                ' ',
                react_1.default.createElement("strong", null, (0, data_1.formattedValueToString)(valueFormatter(state.value.statistics.TotalBytesProcessed))),
                ' ',
                "when run."))),
            react_1.default.createElement(react_1.default.Fragment, null, state.value.isError && react_1.default.createElement("div", { className: styles.error }, error))))));
}
exports.QueryValidator = QueryValidator;
function processErrorMessage(error) {
    const splat = error.split(':');
    if (splat.length > 2) {
        return splat.slice(2).join(':');
    }
    return error;
}
//# sourceMappingURL=QueryValidator.js.map