"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryEditorRaw = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const experimental_1 = require("@grafana/experimental");
const formatSQL_1 = require("../utils/formatSQL");
function QueryEditorRaw({ children, onChange, query, width, height, completionProvider }) {
    // We need to pass query via ref to SQLEditor as onChange is executed via monacoEditor.onDidChangeModelContent callback, not onChange property
    const queryRef = (0, react_1.useRef)(query);
    (0, react_1.useEffect)(() => {
        queryRef.current = query;
    }, [query]);
    const onRawQueryChange = (0, react_1.useCallback)((rawSql, processQuery) => {
        const newQuery = Object.assign(Object.assign({}, queryRef.current), { rawQuery: true, rawSql });
        onChange(newQuery, processQuery);
    }, [onChange]);
    return (react_1.default.createElement(experimental_1.SQLEditor, { width: width, height: height, query: query.rawSql, onChange: onRawQueryChange, language: { id: 'sql', completionProvider, formatter: formatSQL_1.formatSQL } }, children));
}
exports.QueryEditorRaw = QueryEditorRaw;
//# sourceMappingURL=QueryEditorRaw.js.map