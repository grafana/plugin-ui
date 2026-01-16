import React from 'react';
import { useAsync } from 'react-use';

import { type SelectableValue, toOption } from '@grafana/data';
import { Select } from '@grafana/ui';
import { type DB, type ResourceSelectorProps } from './types';
import { type QueryWithDefaults } from './defaults';

interface TableSelectorProps extends ResourceSelectorProps {
  db: DB;
  dataset?: string; // When catalog is present, this represents the schema. Otherwise, it's the dataset.
  catalog?: string;
  value: string | null;
  query: QueryWithDefaults;
  onChange: (v: SelectableValue) => void;
  inputId?: string;
  enableCatalogs?: boolean;
}

export const TableSelector = ({
  db,
  dataset,
  catalog,
  value,
  className,
  onChange,
  inputId,
  enableCatalogs,
}: TableSelectorProps) => {
  const state = useAsync(async () => {
    if (!dataset && !catalog) {
      return [];
    }

    // When catalogs are enabled, we need both catalog and dataset (acting as schema) to load tables
    if (enableCatalogs && (!catalog || !dataset)) {
      return [];
    }

    // db.tables(dataset, catalog)
    // dataset acts as schema when catalog is present, otherwise it's the dataset
    const tables = await db.tables(dataset, catalog);
    return tables.map(toOption);
  }, [dataset, catalog, enableCatalogs]);

  return (
    <Select
      inputId={inputId}
      className={className}
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
