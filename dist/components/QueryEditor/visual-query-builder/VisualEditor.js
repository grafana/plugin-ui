"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VisualEditor = void 0;
const tslib_1 = require("tslib");
const react_1 = tslib_1.__importDefault(require("react"));
const react_use_1 = require("react-use");
const QueryToolbox_1 = require("../query-editor-raw/QueryToolbox");
const Preview_1 = require("./Preview");
const SQLGroupByRow_1 = require("./SQLGroupByRow");
const SQLOrderByRow_1 = require("./SQLOrderByRow");
const SQLSelectRow_1 = require("./SQLSelectRow");
const SQLWhereRow_1 = require("./SQLWhereRow");
const EditorRow_1 = require("./EditorRow");
const EditorField_1 = require("./EditorField");
const EditorRows_1 = require("./EditorRows");
const VisualEditor = ({ query, db, queryRowFilter, onChange, onValidate, range, }) => {
    const state = (0, react_use_1.useAsync)(() => tslib_1.__awaiter(void 0, void 0, void 0, function* () {
        const fields = yield db.fields(query);
        return fields;
    }), [db, query.dataset, query.table]);
    return (react_1.default.createElement(react_1.default.Fragment, null,
        react_1.default.createElement(EditorRows_1.EditorRows, null,
            react_1.default.createElement(EditorRow_1.EditorRow, null,
                react_1.default.createElement(SQLSelectRow_1.SQLSelectRow, { fields: state.value || [], query: query, onQueryChange: onChange, db: db })),
            queryRowFilter.filter && (react_1.default.createElement(EditorRow_1.EditorRow, null,
                react_1.default.createElement(EditorField_1.EditorField, { label: "Filter by column value", optional: true },
                    react_1.default.createElement(SQLWhereRow_1.SQLWhereRow, { fields: state.value || [], query: query, onQueryChange: onChange, db: db })))),
            queryRowFilter.group && (react_1.default.createElement(EditorRow_1.EditorRow, null,
                react_1.default.createElement(EditorField_1.EditorField, { label: "Group by column" },
                    react_1.default.createElement(SQLGroupByRow_1.SQLGroupByRow, { fields: state.value || [], query: query, onQueryChange: onChange, db: db })))),
            queryRowFilter.order && (react_1.default.createElement(EditorRow_1.EditorRow, null,
                react_1.default.createElement(SQLOrderByRow_1.SQLOrderByRow, { fields: state.value || [], query: query, onQueryChange: onChange, db: db }))),
            queryRowFilter.preview && query.rawSql && (react_1.default.createElement(EditorRow_1.EditorRow, null,
                react_1.default.createElement(Preview_1.Preview, { rawSql: query.rawSql })))),
        react_1.default.createElement(QueryToolbox_1.QueryToolbox, { db: db, query: query, onValidate: onValidate, range: range })));
};
exports.VisualEditor = VisualEditor;
//# sourceMappingURL=VisualEditor.js.map