import React, { useEffect, useRef } from 'react';
import { css } from '@emotion/css';
import { useStyles2, Button, Input, Stack, Tooltip } from '@grafana/ui';
import type { GrafanaTheme2 } from '@grafana/data';
import type { FieldInputProps } from './types';

type Props = {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  itemLabel?: string;
};

export function StringArrayField({ field, formField, disabled }: FieldInputProps) {
  const label = field.label ?? field.key;
  return (
    <StringArrayInput
      value={Array.isArray(formField.value) ? (formField.value as string[]) : []}
      onChange={formField.onChange}
      placeholder={field.ui?.placeholder}
      disabled={disabled}
      itemLabel={label.toLowerCase().replace(/s$/, '')}
    />
  );
}

export const StringArrayInput = (props: Props) => {
  const { value, onChange, placeholder, disabled, itemLabel = 'item' } = props;
  const styles = useStyles2(getStyles);
  const items = Array.isArray(value) ? value : [];

  const lastInputRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusLastRef = useRef(false);

  useEffect(() => {
    if (shouldFocusLastRef.current && lastInputRef.current) {
      lastInputRef.current.focus();
      shouldFocusLastRef.current = false;
    }
  }, [items.length]);

  const addItem = () => {
    shouldFocusLastRef.current = true;
    onChange([...items, '']);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, val: string) => {
    onChange(items.map((item, i) => (i === index ? val : item)));
  };

  const isItemValid = (index: number, val: string): boolean => {
    const trimmed = val.trim();
    if (trimmed === '') {
      return false;
    }
    return !items.some((item, i) => i !== index && item.trim() === trimmed);
  };

  const handleEnter = (index: number, currentValue: string) => {
    if (!isItemValid(index, currentValue)) {
      return;
    }
    if (index === items.length - 1) {
      shouldFocusLastRef.current = true;
      onChange([...items, '']);
    }
  };

  return (
    <Stack direction="column" gap={0.5}>
      {items.map((item, i) => (
        <Stack direction="row" gap={1} key={i}>
          <div className={styles.inputCell}>
            <Input
              ref={i === items.length - 1 ? lastInputRef : undefined}
              value={item}
              placeholder={placeholder ?? itemLabel}
              disabled={disabled}
              onChange={(e) => updateItem(i, e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleEnter(i, e.currentTarget.value);
                }
              }}
            />
          </div>
          {!disabled && (
            <Tooltip content={`Remove ${itemLabel}`}>
              <Button
                variant="secondary"
                fill="text"
                size="sm"
                icon="trash-alt"
                aria-label={`Remove ${itemLabel}`}
                onClick={() => removeItem(i)}
                type="button"
              />
            </Tooltip>
          )}
        </Stack>
      ))}
      {!disabled && (
        <div>
          <Button variant="secondary" size="sm" icon="plus" onClick={addItem} type="button">
            Add
          </Button>
        </div>
      )}
    </Stack>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  inputCell: css({
    flex: '1 1 0',
    minWidth: 0,
    overflow: 'hidden',
  }),
});
