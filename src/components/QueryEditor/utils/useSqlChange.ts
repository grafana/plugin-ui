import { useCallback } from 'react';

import { type DB, type SQLExpression, type SQLQuery } from '../types';

import { getRawSqlFn } from './sql.utils';

interface UseSqlChange {
  db: DB;
  query: SQLQuery;
  onQueryChange: (query: SQLQuery) => void;
}

export function useSqlChange({ query, onQueryChange, db }: UseSqlChange) {
  const onSqlChange = useCallback(
    (sql: SQLExpression) => {
      const toRawSql = getRawSqlFn(db);
      const rawSql = toRawSql({
        sql,
        catalog: query.catalog,
        dataset: query.dataset,
        table: query.table,
        refId: query.refId,
      });
      const newQuery: SQLQuery = { ...query, sql, rawSql };
      onQueryChange(newQuery);
    },
    [db, onQueryChange, query]
  );

  return { onSqlChange };
}
