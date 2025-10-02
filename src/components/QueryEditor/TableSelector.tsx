import { useAsync } from 'react-use';

import { type SelectableValue, toOption } from '@grafana/data';
import { Select } from '@grafana/ui';
import { type DB, type ResourceSelectorProps } from './types';
import { type QueryWithDefaults } from './defaults';

interface TableSelectorProps extends ResourceSelectorProps {
  db: DB;
  dataset: string;
  value: string | null;
  query: QueryWithDefaults;
  onChange: (v: SelectableValue) => void;
  inputId?: string;
}

export const TableSelector = ({ db, dataset, value, className, onChange, inputId }: TableSelectorProps) => {
  const state = useAsync(async () => {
    if (!dataset) {
      return [];
    }

    const tables = await db.tables(dataset);
    return tables.map(toOption);
  }, [dataset]);

  return (
    <Select
      inputId={inputId}
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
