import { isEmpty } from 'lodash';

import {
  QueryEditorExpressionType,
  type QueryEditorFunctionExpression,
  type QueryEditorGroupByExpression,
  type QueryEditorPropertyExpression,
  QueryEditorPropertyType,
} from '../expressions';
import { type SQLQuery, type SQLExpression, type DB } from '../types';

export function getRawSqlFn(db: DB) {
  return db.toRawSql ? db.toRawSql : (query: SQLQuery) => toRawSql(query, Boolean(db.disableDatasets));
}

/**
 * Converts a SQLQuery object into a raw SQL string.
 *
 * Table reference naming (mutually exclusive):
 * 1. catalog.schema.table - When catalogs are enabled (catalog && schema && table)
 * 2. dataset.table - When datasets are enabled but catalogs are disabled (dataset && table)
 * 3. table - When both catalogs and datasets are disabled
 *
 */
export function toRawSql({ sql, dataset, catalog, schema, table }: SQLQuery, disableDatasets: boolean): string {
  let rawQuery = '';

  if (!sql || !haveColumns(sql.columns)) {
    return rawQuery;
  }

  rawQuery += createSelectClause(sql.columns);

  // Three-part naming: catalog.schema.table (Unity Catalog style)
  // This takes precedence over everything else
  if (catalog && schema && table) {
    rawQuery += `FROM ${catalog}.${schema}.${table} `;
  }
  // Two-part naming: dataset.table (legacy style, only if catalogs not used)
  else if (!disableDatasets && dataset && table) {
    rawQuery += `FROM ${dataset}.${table} `;
  }
  // Just table name (when datasets are disabled or neither catalog nor dataset is present)
  else if (table) {
    rawQuery += `FROM ${table} `;
  }

  if (sql.whereString) {
    rawQuery += `WHERE ${sql.whereString} `;
  }

  if (sql.groupBy?.[0]?.property.name) {
    const groupBy = sql.groupBy.map((g) => g.property.name).filter((g) => !isEmpty(g));
    rawQuery += `GROUP BY ${groupBy.join(', ')} `;
  }

  if (sql.orderBy?.property.name) {
    rawQuery += `ORDER BY ${sql.orderBy.property.name} `;
  }

  if (sql.orderBy?.property.name && sql.orderByDirection) {
    rawQuery += `${sql.orderByDirection} `;
  }

  if (sql.limit !== undefined && sql.limit >= 0) {
    rawQuery += `LIMIT ${sql.limit} `;
  }

  return rawQuery;
}

function createSelectClause(sqlColumns: NonNullable<SQLExpression['columns']>): string {
  const columns = sqlColumns.map((c) => {
    let rawColumn = '';
    if (c.name) {
      rawColumn += `${c.name}(${c.parameters?.map((p) => `${p.name}`)})`;
    } else {
      rawColumn += `${c.parameters?.map((p) => `${p.name}`)}`;
    }
    return rawColumn;
  });
  return `SELECT ${columns.join(', ')} `;
}

export function haveColumns(columns: SQLExpression['columns']): columns is NonNullable<SQLExpression['columns']> {
  if (!columns) {
    return false;
  }

  const haveColumn = columns.some((c) => c.parameters?.length || c.parameters?.some((p) => p.name));
  const haveFunction = columns.some((c) => c.name);
  return haveColumn || haveFunction;
}

/**
 * Creates a GroupByExpression for a specified field
 */
export function setGroupByField(field?: string): QueryEditorGroupByExpression {
  return {
    type: QueryEditorExpressionType.GroupBy,
    property: {
      type: QueryEditorPropertyType.String,
      name: field,
    },
  };
}

/**
 * Creates a PropertyExpression for a specified field
 */
export function setPropertyField(field?: string): QueryEditorPropertyExpression {
  return {
    type: QueryEditorExpressionType.Property,
    property: {
      type: QueryEditorPropertyType.String,
      name: field,
    },
  };
}

export function createFunctionField(functionName?: string): QueryEditorFunctionExpression {
  return {
    type: QueryEditorExpressionType.Function,
    name: functionName,
    parameters: [],
  };
}
