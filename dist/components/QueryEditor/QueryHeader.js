"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryHeader = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importStar(require("react"));
const react_use_1 = require("react-use");
const ConfirmModal_1 = require("./ConfirmModal");
const DatasetSelector_1 = require("./DatasetSelector");
const ErrorBoundary_1 = require("./ErrorBoundary");
const TableSelector_1 = require("./TableSelector");
const ui_1 = require("@grafana/ui");
const EditorField_1 = require("./EditorField");
const EditorHeader_1 = require("./EditorHeader");
const EditorRow_1 = require("./EditorRow");
const FlexItem_1 = require("./FlexItem");
const InlineSelect_1 = require("./InlineSelect");
const Space_1 = require("./Space");
const types_1 = require("./types");
const sql_utils_1 = require("./utils/sql.utils");
const editorModes = [
    { label: 'Builder', value: types_1.EditorMode.Builder },
    { label: 'Code', value: types_1.EditorMode.Code },
];
function QueryHeader({ db, query, queryRowFilter, onChange, onRunQuery, onQueryRowChange, isQueryRunnable, labels = new Map([['dataset', 'Dataset']]), }) {
    const { editorMode } = query;
    const [_, copyToClipboard] = (0, react_use_1.useCopyToClipboard)();
    const [showConfirm, setShowConfirm] = (0, react_1.useState)(false);
    const toRawSql = db.toRawSql || sql_utils_1.defaultToRawSql;
    const onEditorModeChange = (0, react_1.useCallback)((newEditorMode) => {
        if (editorMode === types_1.EditorMode.Code) {
            setShowConfirm(true);
            return;
        }
        onChange(Object.assign(Object.assign({}, query), { editorMode: newEditorMode }));
    }, [editorMode, onChange, query]);
    const onFormatChange = (e) => {
        const next = Object.assign(Object.assign({}, query), { format: e.value !== undefined ? e.value : types_1.QueryFormat.Table });
        onChange(next);
    };
    const onDatasetChange = (e) => {
        if (e.value === query.dataset) {
            return;
        }
        const next = Object.assign(Object.assign({}, query), { dataset: e.value, table: undefined, sql: undefined, rawSql: '' });
        onChange(next);
    };
    const onTableChange = (e) => {
        if (e.value === query.table) {
            return;
        }
        const next = Object.assign(Object.assign({}, query), { table: e.value, sql: undefined, rawSql: '' });
        onChange(next);
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(EditorHeader_1.EditorHeader, null,
            react_1.default.createElement(ErrorBoundary_1.ErrorBoundary, { fallBackComponent: react_1.default.createElement(ui_1.InlineField, { label: "Format", labelWidth: 15 },
                    react_1.default.createElement(ui_1.Select, { placeholder: "Select format", value: query.format, onChange: onFormatChange, options: types_1.QUERY_FORMAT_OPTIONS })) },
                react_1.default.createElement(InlineSelect_1.InlineSelect, { label: "Format", value: query.format, placeholder: "Select format", menuShouldPortal: true, onChange: onFormatChange, options: types_1.QUERY_FORMAT_OPTIONS })),
            editorMode === types_1.EditorMode.Builder && (react_1.default.createElement(react_1.default.Fragment, null,
                react_1.default.createElement(ui_1.InlineSwitch, { id: "sql-filter", label: "Filter", transparent: true, showLabel: true, value: queryRowFilter.filter, onChange: (ev) => ev.target instanceof HTMLInputElement &&
                        onQueryRowChange(Object.assign(Object.assign({}, queryRowFilter), { filter: ev.target.checked })) }),
                react_1.default.createElement(ui_1.InlineSwitch, { id: "sql-group", label: "Group", transparent: true, showLabel: true, value: queryRowFilter.group, onChange: (ev) => ev.target instanceof HTMLInputElement &&
                        onQueryRowChange(Object.assign(Object.assign({}, queryRowFilter), { group: ev.target.checked })) }),
                react_1.default.createElement(ui_1.InlineSwitch, { id: "sql-order", label: "Order", transparent: true, showLabel: true, value: queryRowFilter.order, onChange: (ev) => ev.target instanceof HTMLInputElement &&
                        onQueryRowChange(Object.assign(Object.assign({}, queryRowFilter), { order: ev.target.checked })) }),
                react_1.default.createElement(ui_1.InlineSwitch, { id: "sql-preview", label: "Preview", transparent: true, showLabel: true, value: queryRowFilter.preview, onChange: (ev) => ev.target instanceof HTMLInputElement &&
                        onQueryRowChange(Object.assign(Object.assign({}, queryRowFilter), { preview: ev.target.checked })) }))),
            react_1.default.createElement(FlexItem_1.FlexItem, { grow: 1 }),
            isQueryRunnable ? (react_1.default.createElement(ui_1.Button, { icon: "play", variant: "primary", size: "sm", onClick: () => onRunQuery() }, "Run query")) : (react_1.default.createElement(ui_1.Tooltip, { theme: "error", content: react_1.default.createElement(react_1.default.Fragment, null,
                    "Your query is invalid. Check below for details. ",
                    react_1.default.createElement("br", null),
                    "However, you can still run this query."), placement: "top" },
                react_1.default.createElement(ui_1.Button, { icon: "exclamation-triangle", variant: "secondary", size: "sm", onClick: () => onRunQuery() }, "Run query"))),
            react_1.default.createElement(ui_1.RadioButtonGroup, { options: editorModes, size: "sm", value: editorMode, onChange: onEditorModeChange }),
            react_1.default.createElement(ConfirmModal_1.ConfirmModal, { isOpen: showConfirm, onCopy: () => {
                    setShowConfirm(false);
                    copyToClipboard(query.rawSql);
                    onChange(Object.assign(Object.assign({}, query), { rawSql: toRawSql(query), editorMode: types_1.EditorMode.Builder }));
                }, onDiscard: () => {
                    setShowConfirm(false);
                    onChange(Object.assign(Object.assign({}, query), { rawSql: toRawSql(query), editorMode: types_1.EditorMode.Builder }));
                }, onCancel: () => setShowConfirm(false) })),
        editorMode === types_1.EditorMode.Builder && (react_1.default.createElement(react_1.default.Fragment, null,
            react_1.default.createElement(Space_1.Space, { v: 0.5 }),
            react_1.default.createElement(EditorRow_1.EditorRow, null,
                react_1.default.createElement(EditorField_1.EditorField, { label: labels.get('dataset') || 'Dataset', width: 25 },
                    react_1.default.createElement(DatasetSelector_1.DatasetSelector, { db: db, value: query.dataset === undefined ? null : query.dataset, onChange: onDatasetChange })),
                react_1.default.createElement(EditorField_1.EditorField, { label: "Table", width: 25 },
                    react_1.default.createElement(TableSelector_1.TableSelector, { db: db, query: query, value: query.table === undefined ? null : query.table, onChange: onTableChange, applyDefault: true })))))));
}
exports.QueryHeader = QueryHeader;
//# sourceMappingURL=QueryHeader.js.map