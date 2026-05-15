import React from 'react';
import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Input, Stack, Tooltip } from '@grafana/ui';

export function StringArrayInput({
  value,
  onChange,
  placeholder,
  disabled,
  itemLabel = 'item',
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
  itemLabel?: string;
}) {
  const styles = useStyles2(getStyles);
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    onChange([...items, '']);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, val: string) => {
    onChange(items.map((item, i) => (i === index ? val : item)));
  };

  return (
    <Stack direction="column" gap={0.5}>
      {items.map((item, i) => (
        <Stack direction="row" gap={1} key={i}>
          <div className={styles.inputCell}>
            <Input
              value={item}
              placeholder={placeholder ?? itemLabel}
              disabled={disabled}
              onChange={(e) => updateItem(i, e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
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
}

const getStyles = (theme: GrafanaTheme2) => ({
  inputCell: css({
    flex: '1 1 0',
    minWidth: 0,
    overflow: 'hidden',
  }),
});
