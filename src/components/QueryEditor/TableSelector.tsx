import React from 'react';
import { useAsync } from 'react-use';

import { SelectableValue, toOption } from '@grafana/data';
import { Select } from '@grafana/ui';
import { DB, ResourceSelectorProps } from './types';
import { QueryWithDefaults } from './defaults';

interface TableSelectorProps extends ResourceSelectorProps {
  db: DB;
  dataset: string;
  value: string | null;
  query: QueryWithDefaults;
  onChange: (v: SelectableValue) => void;
}

export const TableSelector: React.FC<TableSelectorProps> = ({ db, dataset, value, className, onChange }) => {
  const state = useAsync(async () => {
    if (!dataset) {
      return [];
    }

    const tables = await db.tables(dataset)
    return tables.map(toOption);
  }, [dataset]);

  return (
    <Select
      className={className}
      disabled={state.loading}
      aria-label="Table selector"
      value={value}
      options={state.value}
      onChange={onChange}
      isLoading={state.loading}
      menuShouldPortal={true}
      placeholder={state.loading ? 'Loading tables' : 'Select table'}
    />
  );
};
