import React, { useState } from 'react';
import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Input, Icon, Tooltip, Stack } from '@grafana/ui';
import { SECURE_FIELD_CONFIGURED, type IndexedPairItem } from '../../../datasource/schema/datasource';
import { getSecureFieldStyles } from './SecureFieldInput';

function IndexedPairRow({
  item,
  index,
  disabled,
  onUpdate,
  onRemove,
  hideControls,
}: {
  item: IndexedPairItem;
  index: number;
  disabled?: boolean;
  onUpdate: (index: number, key: 'name' | 'value', val: string) => void;
  onRemove: (index: number) => void;
  hideControls?: boolean;
}) {
  const styles = useStyles2(getStyles);
  const secureStyles = useStyles2(getSecureFieldStyles);
  const isConfigured = item.value === SECURE_FIELD_CONFIGURED;
  const [editing, setEditing] = useState(false);
  const [revealed, setRevealed] = useState(false);

  return (
    <Stack direction="row" gap={1}>
      <div className={styles.inputCell}>
        <Input
          value={item.name}
          placeholder="Header name"
          disabled={disabled || hideControls}
          onChange={(e) => onUpdate(index, 'name', e.currentTarget.value)}
        />
      </div>
      <div className={styles.inputCell}>
        {isConfigured && !editing ? (
          <Stack direction="row" gap={1} alignItems="center">
            <span className={secureStyles.configuredBadge}>
              <Icon name="lock" size="xs" />
              Configured
            </span>
            {!disabled && (
              <Button
                variant="secondary"
                fill="text"
                size="sm"
                onClick={() => {
                  setEditing(true);
                  onUpdate(index, 'value', '');
                }}
                type="button"
              >
                Reset
              </Button>
            )}
          </Stack>
        ) : (
          <Input
            value={item.value === SECURE_FIELD_CONFIGURED ? '' : item.value}
            placeholder="Header value"
            disabled={disabled}
            type={revealed ? 'text' : 'password'}
            onChange={(e) => onUpdate(index, 'value', e.currentTarget.value)}
            suffix={
              <Button
                variant="secondary"
                fill="text"
                size="sm"
                icon={revealed ? 'eye-slash' : 'eye'}
                aria-label={revealed ? 'Hide' : 'Reveal'}
                onClick={() => setRevealed((r) => !r)}
                type="button"
              />
            }
          />
        )}
      </div>
      {!hideControls && (
        <Tooltip content="Remove header">
          <Button
            variant="secondary"
            fill="text"
            size="sm"
            icon="trash-alt"
            aria-label="Remove header"
            disabled={disabled}
            onClick={() => onRemove(index)}
            type="button"
          />
        </Tooltip>
      )}
    </Stack>
  );
}

export function IndexedPairEditor({
  value,
  onChange,
  maxItems = 10,
  disabled,
  hideControls,
}: {
  value: IndexedPairItem[];
  onChange: (items: IndexedPairItem[]) => void;
  maxItems?: number;
  disabled?: boolean;
  hideControls?: boolean;
}) {
  const styles = useStyles2(getStyles);
  const items = Array.isArray(value) ? value : [];

  const addItem = () => {
    if (items.length >= maxItems) {
      return;
    }
    onChange([...items, { index: 0, name: '', value: '' }]);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, key: 'name' | 'value', val: string) => {
    const updated = items.map((item, i) => (i === index ? { ...item, [key]: val } : item));
    onChange(updated);
  };

  return (
    <Stack direction="column" gap={0.5}>
      {items.map((item, i) => (
        <IndexedPairRow
          key={item.index || `new-${i}`}
          item={item}
          index={i}
          disabled={disabled}
          onUpdate={updateItem}
          onRemove={removeItem}
          hideControls={hideControls}
        />
      ))}
      {!hideControls && items.length < maxItems && (
        <div>
          <Button variant="secondary" size="sm" icon="plus" disabled={disabled} onClick={addItem} type="button">
            Add header
          </Button>
        </div>
      )}
      {!hideControls && items.length >= maxItems && (
        <span className={styles.limitNote}>Maximum {maxItems} headers reached</span>
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
  limitNote: css({
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
  }),
});
