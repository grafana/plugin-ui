import React from 'react';
import { useAsync } from 'react-use';

import { SelectableValue, toOption } from '@grafana/data';

import { SelectRow } from './SelectRow';
import { QueryWithDefaults } from '../defaults';
import { SQLQuery, DB } from '../types';
import { useSqlChange } from '../utils/useSqlChange';

interface SQLSelectRowProps {
  fields: SelectableValue[];
  query: QueryWithDefaults;
  onQueryChange: (query: SQLQuery) => void;
  db: DB;
}

export function SQLSelectRow({ fields, query, onQueryChange, db }: SQLSelectRowProps) {
  const { onSqlChange } = useSqlChange({ query, onQueryChange, db });

  const state = useAsync(async () => {
    const functions = await db.functions();
    return functions.map((f) => toOption(f.name));
  }, [db]);

  return <SelectRow columns={fields} sql={query.sql!} functions={state.value} onSqlChange={onSqlChange} />;
}
