"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFunctionField = exports.setPropertyField = exports.setGroupByField = exports.haveColumns = exports.defaultToRawSql = void 0;
const lodash_1 = require("lodash");
const expressions_1 = require("../expressions");
function defaultToRawSql({ sql, dataset, table }) {
    var _a, _b, _c, _d;
    let rawQuery = '';
    // Return early with empty string if there is no sql column
    if (!sql || !(0, exports.haveColumns)(sql.columns)) {
        return rawQuery;
    }
    rawQuery += createSelectClause(sql.columns);
    if (dataset && table) {
        rawQuery += `FROM ${dataset}.${table} `;
    }
    if (sql.whereString) {
        rawQuery += `WHERE ${sql.whereString} `;
    }
    if ((_b = (_a = sql.groupBy) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.property.name) {
        const groupBy = sql.groupBy.map((g) => g.property.name).filter((g) => !(0, lodash_1.isEmpty)(g));
        rawQuery += `GROUP BY ${groupBy.join(', ')} `;
    }
    if ((_c = sql.orderBy) === null || _c === void 0 ? void 0 : _c.property.name) {
        rawQuery += `ORDER BY ${sql.orderBy.property.name} `;
    }
    if (((_d = sql.orderBy) === null || _d === void 0 ? void 0 : _d.property.name) && sql.orderByDirection) {
        rawQuery += `${sql.orderByDirection} `;
    }
    // Altough LIMIT 0 doesn't make sense, it is still possible to have LIMIT 0
    if (sql.limit !== undefined && sql.limit >= 0) {
        rawQuery += `LIMIT ${sql.limit} `;
    }
    return rawQuery;
}
exports.defaultToRawSql = defaultToRawSql;
function createSelectClause(sqlColumns) {
    const columns = sqlColumns.map((c) => {
        var _a, _b;
        let rawColumn = '';
        if (c.name) {
            rawColumn += `${c.name}(${(_a = c.parameters) === null || _a === void 0 ? void 0 : _a.map((p) => `${p.name}`)})`;
        }
        else {
            rawColumn += `${(_b = c.parameters) === null || _b === void 0 ? void 0 : _b.map((p) => `${p.name}`)}`;
        }
        return rawColumn;
    });
    return `SELECT ${columns.join(', ')} `;
}
const haveColumns = (columns) => {
    if (!columns) {
        return false;
    }
    const haveColumn = columns.some((c) => { var _a, _b; return ((_a = c.parameters) === null || _a === void 0 ? void 0 : _a.length) || ((_b = c.parameters) === null || _b === void 0 ? void 0 : _b.some((p) => p.name)); });
    const haveFunction = columns.some((c) => c.name);
    return haveColumn || haveFunction;
};
exports.haveColumns = haveColumns;
/**
 * Creates a GroupByExpression for a specified field
 */
function setGroupByField(field) {
    return {
        type: expressions_1.QueryEditorExpressionType.GroupBy,
        property: {
            type: expressions_1.QueryEditorPropertyType.String,
            name: field,
        },
    };
}
exports.setGroupByField = setGroupByField;
/**
 * Creates a PropertyExpression for a specified field
 */
function setPropertyField(field) {
    return {
        type: expressions_1.QueryEditorExpressionType.Property,
        property: {
            type: expressions_1.QueryEditorPropertyType.String,
            name: field,
        },
    };
}
exports.setPropertyField = setPropertyField;
function createFunctionField(functionName) {
    return {
        type: expressions_1.QueryEditorExpressionType.Function,
        name: functionName,
        parameters: [],
    };
}
exports.createFunctionField = createFunctionField;
//# sourceMappingURL=sql.utils.js.map