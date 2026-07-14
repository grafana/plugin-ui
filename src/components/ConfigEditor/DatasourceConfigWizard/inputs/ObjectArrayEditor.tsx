import React from 'react';
import { css } from '@emotion/css';
import { useStyles2, Button, Tooltip, Stack } from '@grafana/ui';
import { type GrafanaTheme2 } from '@grafana/data';
import { SECURE_FIELD_CONFIGURED, findActiveSecureOverride } from '../datasource';
import { type ConfigField } from '../../../../schema/schema';
import { FieldInput } from './FieldInput';
import { parseItemErrors } from './fieldUtils';
import { type FormFieldRef } from './types';

type Props = {
  field: ConfigField;
  value: unknown;
  onChange: (items: Array<Record<string, unknown>>) => void;
  disabled?: boolean;
  errorMessage?: string;
};

export function ObjectArrayEditor(props: Props) {
  const { field, value, onChange, disabled, errorMessage } = props;
  const styles = useStyles2(getStyles);
  const itemFields = field.item?.fields ?? [];
  const layoutRows = computeLayoutRows(itemFields);
  const items = Array.isArray(value) ? (value as Array<Record<string, unknown>>) : [];
  const maxItems =
    field.validations?.find((v): v is { type: 'itemCount'; max?: number } => v.type === 'itemCount')?.max ?? 20;
  const label = field.label ?? field.key;
  const itemErrors = parseItemErrors(errorMessage);

  const addItem = () => {
    if (items.length >= maxItems) {
      return;
    }
    const empty: Record<string, unknown> = {};
    for (const f of itemFields) {
      if (f.valueType === 'boolean') {
        empty[f.key] = f.defaultValue ?? false;
      } else {
        empty[f.key] = f.defaultValue ?? '';
      }
    }
    onChange([...items, empty]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: string, val: unknown) => {
    const updated = items.map((item, i) => (i === index ? { ...item, [key]: val } : item));
    onChange(updated);
  };

  return (
    <Stack direction="column" gap={1}>
      {items.map((item, i) => (
        <ObjectArrayItemRow
          key={i}
          item={item}
          index={i}
          itemFields={itemFields}
          layoutRows={layoutRows}
          disabled={!!disabled}
          onUpdate={updateItem}
          onRemove={removeItem}
          showLabels={true}
          error={itemErrors?.[i]}
        />
      ))}
      {items.length < maxItems && (
        <div>
          <Button variant="secondary" size="sm" icon="plus" disabled={disabled} onClick={addItem} type="button">
            Add {label.toLowerCase()}
          </Button>
        </div>
      )}
      {items.length >= maxItems && <span className={styles.limitNote}>Maximum {maxItems} items reached</span>}
    </Stack>
  );
}

function computeLayoutRows(fields: ConfigField[]): ConfigField[][] {
  const hasExplicitRow = fields.some((f) => f.ui?.row !== undefined);

  if (!hasExplicitRow) {
    if (fields.length <= 3) {
      return [fields];
    }
    return fields.map((f) => [f]);
  }

  // Group by row number
  const rowMap = new Map<number, ConfigField[]>();
  const noRow: ConfigField[] = [];

  for (const f of fields) {
    if (f.ui?.row !== undefined) {
      const existing = rowMap.get(f.ui.row);
      if (existing) {
        existing.push(f);
      } else {
        rowMap.set(f.ui.row, [f]);
      }
    } else {
      noRow.push(f);
    }
  }

  // Sort by row number ascending
  const sortedKeys = [...rowMap.keys()].sort((a, b) => a - b);
  const rows: ConfigField[][] = sortedKeys.map((k) => rowMap.get(k)!);

  // Append fields without row, one per row
  for (const f of noRow) {
    rows.push([f]);
  }

  return rows;
}

function makeItemFormField(
  item: Record<string, unknown>,
  index: number,
  fieldKey: string,
  onUpdate: (index: number, key: string, value: unknown) => void
): FormFieldRef {
  return {
    name: `item-${index}-${fieldKey}`,
    value: item[fieldKey],
    onChange: (eventOrValue: unknown) => {
      // FieldInput spreads formField onto <Input> / <TextArea>,
      // so onChange receives a React ChangeEvent. Extract the value.
      if (eventOrValue != null && typeof eventOrValue === 'object' && 'target' in (eventOrValue as object)) {
        onUpdate(index, fieldKey, (eventOrValue as React.ChangeEvent<HTMLInputElement>).target.value);
      } else {
        onUpdate(index, fieldKey, eventOrValue);
      }
    },
    onBlur: () => {},
  };
}

function effectiveItemField(field: ConfigField, isSecure: boolean): ConfigField {
  if (!isSecure) {
    return field;
  }
  return { ...field };
}

function ObjectArrayItemRow({
  item,
  index,
  itemFields,
  layoutRows,
  disabled,
  onUpdate,
  onRemove,
  showLabels,
  error,
}: {
  item: Record<string, unknown>;
  index: number;
  itemFields: ConfigField[];
  layoutRows: ConfigField[][];
  disabled: boolean;
  onUpdate: (index: number, key: string, value: unknown) => void;
  onRemove: (index: number) => void;
  showLabels: boolean;
  error?: string;
}) {
  const styles = useStyles2(getStyles);
  const secureOverride = findActiveSecureOverride(itemFields, item, index);

  return (
    <div className={styles.itemRow}>
      {layoutRows.map((row, rowIdx) => (
        <Stack key={rowIdx} direction="row" gap={1} alignItems="flex-end" wrap="wrap">
          {row.map((field) => {
            const isSecureTarget = secureOverride?.fieldKey === field.key;
            const eff = effectiveItemField(field, !!isSecureTarget);
            const formField = makeItemFormField(item, index, field.key, onUpdate);

            if (isSecureTarget && item[field.key] === SECURE_FIELD_CONFIGURED) {
              formField.value = SECURE_FIELD_CONFIGURED;
            }

            return (
              <div key={field.key} className={field.valueType === 'boolean' ? styles.boolCell : styles.inputCell}>
                <span className={styles.cellLabel}>
                  {field.label ?? field.key}
                  {field.required && <span className={styles.required}> *</span>}
                </span>
                <FieldInput field={eff} formField={formField} disabled={disabled} />
              </div>
            );
          })}
          {rowIdx === 0 && (
            <div className={styles.removeCellWithLabel}>
              <Tooltip content="Remove">
                <Button
                  variant="secondary"
                  fill="text"
                  size="sm"
                  icon="trash-alt"
                  aria-label="Remove item"
                  disabled={disabled}
                  onClick={() => onRemove(index)}
                  type="button"
                />
              </Tooltip>
            </div>
          )}
        </Stack>
      ))}
      {error && <span className={styles.itemError}>{error}</span>}
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  itemRow: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    padding: theme.spacing(1),
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  inputCell: css({
    flex: '1 1 120px',
    minWidth: 120,
    overflow: 'hidden',
  }),
  boolCell: css({
    flex: '0 0 auto',
    minWidth: 0,
  }),
  cellLabel: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    marginBottom: theme.spacing(0.25),
  }),
  required: css({
    color: theme.colors.error.text,
  }),
  removeCellWithLabel: css({
    flex: '0 0 auto',
    display: 'flex',
    alignItems: 'flex-end',
    paddingBottom: theme.spacing(0.25),
  }),
  itemError: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.error.text,
  }),
  limitNote: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
});
