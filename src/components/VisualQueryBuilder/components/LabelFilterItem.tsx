import  { uniqBy } from 'lodash';
import React, { useRef, useState } from 'react';
import { v4 } from 'uuid';

import { SelectableValue, toOption } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { InlineField, Select } from '@grafana/ui';

import { QueryBuilderLabelFilter } from '../types';
import { InputGroup } from '../../QueryEditor/InputGroup';
import { AccessoryButton } from '../../QueryEditor/AccessoryButton';

const CONFLICTING_LABEL_FILTER_ERROR_MESSAGE = 'You have conflicting label filters';
interface Props {
  defaultOp: string;
  item: Partial<QueryBuilderLabelFilter>;
  items: Array<Partial<QueryBuilderLabelFilter>>;
  onChange: (value: Partial<QueryBuilderLabelFilter>) => void;
  onGetLabelNames: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<Array<SelectableValue<string>>>;
  onGetLabelValues: (forLabel: Partial<QueryBuilderLabelFilter>) => Promise<Array<SelectableValue<string>>>;
  onDelete: () => void;
  invalidLabel?: boolean;
  invalidValue?: boolean;
  multiValueSeparator?: string;
}

export function LabelFilterItem({
  item,
  items,
  defaultOp,
  onChange,
  onDelete,
  onGetLabelNames,
  onGetLabelValues,
  invalidLabel,
  invalidValue,
  multiValueSeparator = "|",
}: Props) {
  const [state, setState] = useState<{
    labelNames?: Array<SelectableValue<string>>;
    labelValues?: Array<SelectableValue<string>>;
    isLoadingLabelNames?: boolean;
    isLoadingLabelValues?: boolean;
  }>({});
  // there's a bug in react-select where the menu doesn't recalculate its position when the options are loaded asynchronously
  // see https://github.com/grafana/grafana/issues/63558
  // instead, we explicitly control the menu visibility and prevent showing it until the options have fully loaded
  const [labelNamesMenuOpen, setLabelNamesMenuOpen] = useState(false);
  const [labelValuesMenuOpen, setLabelValuesMenuOpen] = useState(false);

  const isMultiSelect = (operator = item.op) => {
    return operators.find((op) => op.label === operator)?.isMultiValue;
  };

  const getSelectOptionsFromString = (item?: string): string[] => {
    if (item) {
      if (item.indexOf(multiValueSeparator) > 0) {
        return item.split(multiValueSeparator);
      }
      return [item];
    }
    return [];
  };

  const getOptions = (): Array<SelectableValue<string>> => {
    const labelValues = state.labelValues ? [...state.labelValues] : [];
    const selectedOptions = getSelectOptionsFromString(item?.value).map(toOption);

    // Remove possible duplicated values
    return uniqBy([...selectedOptions, ...labelValues], 'value');
  };

  const isConflicting = isConflictingLabelFilter(item, items);
  const { current: id } = useRef(v4());

  return (
    <div data-testid="visual-query-builder-dimensions-filter-item">
      <InlineField error={CONFLICTING_LABEL_FILTER_ERROR_MESSAGE} invalid={isConflicting ? true : undefined}>
        <InputGroup>
          <Select<string>
            placeholder="Select label"
            data-testid={selectors.components.QueryBuilder.labelSelect}
            inputId={`visual-query-builder-dimensions-filter-item-key-${id}`}
            width="auto"
            value={item.label ? toOption(item.label) : null}
            allowCustomValue
            onOpenMenu={async () => {
              setState({ isLoadingLabelNames: true });
              const labelNames = await onGetLabelNames(item);
              setLabelNamesMenuOpen(true);
              setState({ labelNames, isLoadingLabelNames: undefined });
            }}
            onCloseMenu={() => {
              setLabelNamesMenuOpen(false);
            }}
            isOpen={labelNamesMenuOpen}
            isLoading={state.isLoadingLabelNames}
            options={state.labelNames}
            onChange={(change) => {
              if (change.value) {
                onChange({
                  ...item,
                  op: item.op ?? defaultOp,
                  label: change.value,
                });
              }
            }}
            invalid={isConflicting || invalidLabel}
          />

          <Select<string>
            data-testid={selectors.components.QueryBuilder.matchOperatorSelect}
            value={toOption(item.op ?? defaultOp)}
            options={operators}
            width="auto"
            onChange={(change) => {
              if (change.value) {
                onChange({
                  ...item,
                  op: change.value,
                  value: isMultiSelect(change.value) ? item.value  : getSelectOptionsFromString(item?.value)[0],
                });
              }
            }}
            invalid={isConflicting}
          />

          <Select<string>
            placeholder="Select value"
            data-testid={selectors.components.QueryBuilder.valueSelect}
            inputId={`visual-query-builder-dimensions-filter-item-value-${id}`}
            width="auto"
            value={
              isMultiSelect()
                ? getSelectOptionsFromString(item?.value).map(toOption)
                : getSelectOptionsFromString(item?.value).map(toOption)[0]
            }
            allowCustomValue
            onOpenMenu={async () => {
              setState({ isLoadingLabelValues: true });
              const labelValues = await onGetLabelValues(item);
              setState({
                ...state,
                labelValues,
                isLoadingLabelValues: undefined,
              });
              setLabelValuesMenuOpen(true);
            }}
            onCloseMenu={() => {
              setLabelValuesMenuOpen(false);
            }}
            isOpen={labelValuesMenuOpen}
            isMulti={isMultiSelect()}
            isLoading={state.isLoadingLabelValues}
            options={getOptions()}
            onChange={(change) => {
              if (change.value) {
                onChange({
                  ...item,
                  value: change.value,
                  op: item.op ?? defaultOp,
                });
              } else {
                // otherwise, we're dealing with a multi-value select which is array of options
                const changes = change
                  .map((change: SelectableValue<string>) => {
                    if (change.value) {
                      return change.value;
                    } else {
                      return undefined
                    }
                  })
                  .filter((val: string | undefined) => val !== undefined)
                  .join(multiValueSeparator);
                onChange({ ...item, value: changes, op: item.op ?? defaultOp });
              }
            }}
            invalid={isConflicting || invalidValue}
          />
          <AccessoryButton aria-label="remove" icon="times" variant="secondary" onClick={onDelete} />
        </InputGroup>
      </InlineField>
    </div>
  );
}

const operators = [
   { label: '=', value: '=', description: 'Equals', isMultiValue: false },
   { label: '!=', value: '!=', description: 'Does not equal', isMultiValue: false },
   { label: '=~', value: '=~', description: 'Matches regex', isMultiValue: true },
   { label: '!~', value: '!~', description: 'Does not match regex', isMultiValue: true },
]


export function isConflictingLabelFilter(
  newLabel: Partial<QueryBuilderLabelFilter>,
  labels: Array<Partial<QueryBuilderLabelFilter>>
): boolean {
  if (!newLabel.label || !newLabel.op || !newLabel.value) {
    return false;
  }

  if (labels.length < 2) {
    return false;
  }

  const operationIsNegative = newLabel.op.toString().startsWith('!');

  const candidates = labels.filter(
    (label) => label.label === newLabel.label && label.value === newLabel.value && label.op !== newLabel.op
  );

  const conflict = candidates.some((candidate) => {
    if (operationIsNegative && candidate?.op?.toString().startsWith('!') === false) {
      return true;
    }
    if (operationIsNegative === false && candidate?.op?.toString().startsWith('!')) {
      return true;
    }
    return false;
  });

  return conflict;
}
