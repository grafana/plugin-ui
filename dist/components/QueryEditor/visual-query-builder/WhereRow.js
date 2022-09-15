"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhereRow = void 0;
const tslib_1 = require("tslib");
const css_1 = require("@emotion/css");
const react_1 = tslib_1.__importStar(require("react"));
const react_awesome_query_builder_1 = require("react-awesome-query-builder");
const AwesomeQueryBuilder_1 = require("./AwesomeQueryBuilder");
function WhereRow({ sql, config, onSqlChange }) {
    const [tree, setTree] = (0, react_1.useState)();
    const configWithDefaults = (0, react_1.useMemo)(() => (Object.assign(Object.assign({}, AwesomeQueryBuilder_1.raqbConfig), config)), [config]);
    (0, react_1.useEffect)(() => {
        var _a;
        // Set the initial tree
        if (!tree) {
            const initTree = react_awesome_query_builder_1.Utils.checkTree(react_awesome_query_builder_1.Utils.loadTree((_a = sql.whereJsonTree) !== null && _a !== void 0 ? _a : AwesomeQueryBuilder_1.emptyInitTree), configWithDefaults);
            setTree(initTree);
        }
    }, [configWithDefaults, sql.whereJsonTree, tree]);
    (0, react_1.useEffect)(() => {
        if (!sql.whereJsonTree) {
            setTree(react_awesome_query_builder_1.Utils.checkTree(react_awesome_query_builder_1.Utils.loadTree(AwesomeQueryBuilder_1.emptyInitTree), configWithDefaults));
        }
    }, [configWithDefaults, sql.whereJsonTree]);
    const onTreeChange = (0, react_1.useCallback)((changedTree, config) => {
        setTree(changedTree);
        const newSql = Object.assign(Object.assign({}, sql), { whereJsonTree: react_awesome_query_builder_1.Utils.getTree(changedTree), whereString: react_awesome_query_builder_1.Utils.sqlFormat(changedTree, config) });
        onSqlChange(newSql);
    }, [onSqlChange, sql]);
    if (!tree) {
        return null;
    }
    return (react_1.default.createElement(react_awesome_query_builder_1.Query, Object.assign({}, configWithDefaults, { value: tree, onChange: onTreeChange, renderBuilder: (props) => react_1.default.createElement(react_awesome_query_builder_1.Builder, Object.assign({}, props)) })));
}
exports.WhereRow = WhereRow;
function flex(direction) {
    return `
    display: flex;
    gap: 8px;
    flex-direction: ${direction};`;
}
// eslint-disable-next-line @typescript-eslint/no-unused-expressions
(0, css_1.injectGlobal) `
  .group--header {
    ${flex('row')}
  }

  .group-or-rule {
    ${flex('column')}
    .rule {
      flex-direction: row;
    }
  }

  .rule--body {
    ${flex('row')}
  }

  .group--children {
    ${flex('column')}
  }

  .group--conjunctions:empty {
    display: none;
  }
`;
//# sourceMappingURL=WhereRow.js.map