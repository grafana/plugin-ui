import React from 'react';

import { type SelectableValue } from '@grafana/data';

import { OrderByRow } from './OrderByRow';
import { type QueryWithDefaults } from '../defaults';
import { type SQLQuery, type DB } from '../types';
import { useSqlChange } from '../utils/useSqlChange';

type SQLOrderByRowProps = {
  fields: SelectableValue[];
  query: QueryWithDefaults;
  onQueryChange: (query: SQLQuery) => void;
  db: DB;
};

export function SQLOrderByRow({ fields, query, onQueryChange, db }: SQLOrderByRowProps) {
  const { onSqlChange } = useSqlChange({ query, onQueryChange, db });
  let columnsWithIndices: SelectableValue[] = [];

  if (fields) {
    const options = query.sql?.columns?.map((c, i) => {
      const value = c.name ? `${c.name}(${c.parameters?.map((p) => p.name)})` : c.parameters?.map((p) => p.name);
      return {
        value,
        label: `${i + 1} - ${value}`,
      };
    });
    columnsWithIndices = [
      {
        value: '',
        label: 'Selected columns',
        options,
        expanded: true,
      },
      ...fields,
    ];
  }

  return <OrderByRow sql={query.sql!} onSqlChange={onSqlChange} columns={columnsWithIndices} />;
}
