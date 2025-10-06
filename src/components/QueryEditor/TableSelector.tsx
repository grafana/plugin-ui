import { useAsync } from 'react-use';

import { type SelectableValue, toOption } from '@grafana/data';
import { Select } from '@grafana/ui';
import { type DB, type ResourceSelectorProps } from './types';
import { type QueryWithDefaults } from './defaults';

interface TableSelectorProps extends ResourceSelectorProps {
  db: DB;
  dataset?: string;
  catalog?: string | null;
  schema?: string | null;
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
  schema,
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

    // When catalogs are enabled, we need both catalog and schema to load tables
    if (enableCatalogs && (!catalog || !schema)) {
      return [];
    }

    const tables = await db.tables(dataset, catalog || undefined, schema || undefined);
    return tables.map(toOption);
  }, [dataset, catalog, schema, enableCatalogs]);

  // Determine if the selector should be disabled
  const isDisabled = state.loading || (enableCatalogs && (!catalog || !schema));

  return (
    <Select
      inputId={inputId}
      className={className}
      disabled={isDisabled}
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
