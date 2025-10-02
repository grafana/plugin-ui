import { type SelectableValue } from '@grafana/data';

import { GroupByRow } from './GroupByRow';
import { type QueryWithDefaults } from '../defaults';
import { type SQLQuery, type DB } from '../types';
import { useSqlChange } from '../utils/useSqlChange';

interface SQLGroupByRowProps {
  fields: SelectableValue[];
  query: QueryWithDefaults;
  onQueryChange: (query: SQLQuery) => void;
  db: DB;
}

export function SQLGroupByRow({ fields, query, onQueryChange, db }: SQLGroupByRowProps) {
  const { onSqlChange } = useSqlChange({ query, onQueryChange, db });

  return <GroupByRow columns={fields} sql={query.sql!} onSqlChange={onSqlChange} />;
}
