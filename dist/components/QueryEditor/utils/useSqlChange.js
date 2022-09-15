"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSqlChange = void 0;
const react_1 = require("react");
const sql_utils_1 = require("./sql.utils");
function useSqlChange({ query, onQueryChange, db }) {
    const onSqlChange = (0, react_1.useCallback)((sql) => {
        const toRawSql = db.toRawSql || sql_utils_1.defaultToRawSql;
        const rawSql = toRawSql({ sql, dataset: query.dataset, table: query.table, refId: query.refId });
        const newQuery = Object.assign(Object.assign({}, query), { sql, rawSql });
        onQueryChange(newQuery);
    }, [db, onQueryChange, query]);
    return { onSqlChange };
}
exports.useSqlChange = useSqlChange;
//# sourceMappingURL=useSqlChange.js.map