import React, { useEffect } from 'react';
import { useAsync } from 'react-use';

import { type SelectableValue } from '@grafana/data';
import { Select } from '@grafana/ui';

import { type DB, type ResourceSelectorProps, toOption } from './types';

interface DatasetSelectorProps extends ResourceSelectorProps {
  db: DB;
  dataset: string;
  value: string | null;
  applyDefault?: boolean;
  disabled?: boolean;
  onChange: (v: SelectableValue) => void;
  inputId?: string;
}

export const DatasetSelector = ({
  db,
  dataset,
  value,
  onChange,
  disabled,
  className,
  applyDefault,
  inputId,
}: DatasetSelectorProps) => {
  const state = useAsync(async () => {
    if (dataset) {
      onChange(toOption(dataset));
      return [toOption(dataset)];
    }

    const datasets = await db.datasets();
    return datasets.map(toOption);
  }, []);

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
    />
  );
};
