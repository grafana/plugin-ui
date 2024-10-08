import { isEqual } from 'lodash';
import React, { useEffect, useState } from 'react';

import { SelectableValue } from '@grafana/data';

import { QueryBuilderLabelFilter } from '../types';

import { EditorField, } from '../../QueryEditor/EditorField';
import { EditorFieldGroup } from '../../QueryEditor/EditorFieldGroup';
import { EditorList } from '../../QueryEditor/EditorList';
import { LabelFilterItem } from './LabelFilterItem';


export const MISSING_LABEL_FILTER_ERROR_MESSAGE = 'Select at least 1 label filter (label and value)';

export interface Props {
  labelsFilters: QueryBuilderLabelFilter[];
  onChange: (labelFilters: QueryBuilderLabelFilter[]) => void;
  onGetLabelNames: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  onGetLabelValues: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<SelectableValue[]>;
  /** If set to true, component will show error message until at least 1 filter is selected */
  labelFilterRequired?: boolean;
  multiValueSeparator?: string;
}

export function LabelFilters({
  labelsFilters,
  onChange,
  onGetLabelNames,
  onGetLabelValues,
  labelFilterRequired,
  multiValueSeparator,
}: Props) {
  const defaultOp = '=';
  const [items, setItems] = useState<Array<Partial<QueryBuilderLabelFilter>>>([{ op: defaultOp }]);

  useEffect(() => {
    if (labelsFilters.length > 0) {
      setItems(labelsFilters);
    } else {
      setItems([{ op: defaultOp }]);
    }
  }, [labelsFilters]);

  const onLabelsChange = (newItems: Array<Partial<QueryBuilderLabelFilter>>) => {
    setItems(newItems);

    // Extract full label filters with both label & value
    const newLabels = newItems.filter((item): item is QueryBuilderLabelFilter  => item.label !== undefined && item.value !== undefined);
    if (!isEqual(newLabels, labelsFilters)) {
      onChange(newLabels);
    }
  };

  const hasLabelFilter = items.some((item) => item.label && item.value);

  return (
    <EditorFieldGroup>
      <EditorField
        label="Label filters"
        error={MISSING_LABEL_FILTER_ERROR_MESSAGE}
        invalid={labelFilterRequired && !hasLabelFilter}
      >
        <EditorList
          items={items}
          onChange={onLabelsChange}
          renderItem={(item: Partial<QueryBuilderLabelFilter>, onChangeItem, onDelete) => (
            <LabelFilterItem
              item={item}
              items={items}
              defaultOp={defaultOp}
              onChange={onChangeItem}
              onDelete={onDelete}
              onGetLabelNames={onGetLabelNames}
              onGetLabelValues={onGetLabelValues}
              invalidLabel={labelFilterRequired && !item.label}
              invalidValue={labelFilterRequired && !item.value}
              multiValueSeparator={multiValueSeparator}
            />
          )}
        />
      </EditorField>
    </EditorFieldGroup>
  );
}
