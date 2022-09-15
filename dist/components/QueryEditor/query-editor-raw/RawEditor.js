"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RawEditor = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importStar(require("react"));
const react_use_1 = require("react-use");
// @ts-ignore
const react_virtualized_auto_sizer_1 = tslib_1.__importDefault(require("react-virtualized-auto-sizer"));
const ui_1 = require("@grafana/ui");
const QueryEditorRaw_1 = require("./QueryEditorRaw");
const QueryToolbox_1 = require("./QueryToolbox");
function RawEditor({ db, query, onChange, onRunQuery, onValidate, queryToValidate, range }) {
    const theme = (0, ui_1.useTheme2)();
    const styles = (0, ui_1.useStyles2)(getStyles);
    const [isExpanded, setIsExpanded] = (0, react_1.useState)(false);
    const [toolboxRef, toolboxMeasure] = (0, react_use_1.useMeasure)();
    const [editorRef, editorMeasure] = (0, react_use_1.useMeasure)();
    const completionProvider = (0, react_1.useMemo)(() => db.getSqlCompletionProvider(), [db]);
    const renderQueryEditor = (width, height) => {
        return (react_1.default.createElement(QueryEditorRaw_1.QueryEditorRaw, { completionProvider: completionProvider, query: query, width: width, height: height ? height - toolboxMeasure.height : undefined, onChange: onChange }, ({ formatQuery }) => {
            return (react_1.default.createElement("div", { ref: toolboxRef },
                react_1.default.createElement(QueryToolbox_1.QueryToolbox, { db: db, query: queryToValidate, onValidate: onValidate, onFormatCode: formatQuery, showTools: true, range: range, onExpand: setIsExpanded, isExpanded: isExpanded })));
        }));
    };
    const renderEditor = (standalone = false) => {
        return standalone ? (react_1.default.createElement(react_virtualized_auto_sizer_1.default, null, ({ width, height }) => {
            return renderQueryEditor(width, height);
        })) : (react_1.default.createElement("div", { ref: editorRef }, renderQueryEditor()));
    };
    const renderPlaceholder = () => {
        return (react_1.default.createElement("div", { style: {
                width: editorMeasure.width,
                height: editorMeasure.height,
                background: theme.colors.background.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
            } }, "Editing in expanded code editor"));
    };
    return (react_1.default.createElement(react_1.default.Fragment, null,
        isExpanded ? renderPlaceholder() : renderEditor(),
        isExpanded && (react_1.default.createElement(ui_1.Modal, { title: `Query ${query.refId}`, closeOnBackdropClick: false, closeOnEscape: false, className: styles.modal, contentClassName: styles.modalContent, isOpen: isExpanded, onDismiss: () => {
                setIsExpanded(false);
            } }, renderEditor(true)))));
}
exports.RawEditor = RawEditor;
function getStyles(theme) {
    return {
        modal: (0, css_1.css) `
      width: 95vw;
      height: 95vh;
    `,
        modalContent: (0, css_1.css) `
      height: 100%;
      padding-top: 0;
    `,
    };
}
//# sourceMappingURL=RawEditor.js.map