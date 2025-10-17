import { useEffect } from 'react';
import { useAsync } from 'react-use';

import { type SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';

import { type DB, type ResourceSelectorProps, toOption } from './types';

interface DatasetSelectorProps extends ResourceSelectorProps {
  db: DB;
  dataset?: string;
  catalog?: string; // When provided, fetch schemas instead of datasets
  value: string | null;
  applyDefault?: boolean;
  disabled?: boolean;
  onChange: (v: SelectableValue) => void;
  inputId?: string;
  enableCatalogs?: boolean;
  'data-testid'?: string;
}

export const DatasetSelector = ({
  db,
  dataset,
  catalog,
  value,
  onChange,
  disabled,
  className,
  applyDefault,
  inputId,
  enableCatalogs,
  'data-testid': dataTestId,
}: DatasetSelectorProps) => {
  const state = useAsync(async () => {
    // If a default dataset is provided, use it
    if (dataset) {
      onChange(toOption(dataset));
      return [toOption(dataset)];
    }

    // Fetch datasets - when catalog is provided, db.datasets(catalog) returns schemas for that catalog
    const datasets = await db.datasets(catalog);
    return datasets.map(toOption);
  }, [catalog]);

  useEffect(() => {
    if (!applyDefault) {
      return;
    }
    // Set default dataset when values are fetched
    if (!value) {
      if (state.value && state.value[0]) {
        onChange(state.value[0]);
      }
    } else {
      if (state.value && state.value.find((v) => v.value === value) === undefined) {
        // if value is set and newly fetched values does not contain selected value
        if (state.value.length > 0) {
          onChange(state.value[0]);
        }
      }
    }
  }, [state.value, value, applyDefault, onChange]);

  return (
    <Select
      inputId={inputId}
      className={className}
      aria-label="Dataset selector"
      value={value}
      options={state.value}
      onChange={onChange}
      disabled={disabled}
      isLoading={state.loading}
      menuShouldPortal={true}
      data-testid={dataTestId}
      placeholder={enableCatalogs ? 'Select schema' : 'Select dataset'}
    />
  );
};
