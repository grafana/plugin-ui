import React, { useState } from 'react';
import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Input, Icon } from '@grafana/ui';

export function StringArrayInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState('');
  const styles = useStyles2(getStyles);

  const addTag = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setDraft('');
  };

  const removeTag = (tag: string) => {
    onChange(value.filter((v) => v !== tag));
  };

  return (
    <div className={styles.container}>
      {value.length > 0 && (
        <div className={styles.tags}>
          {value.map((tag) => (
            <span key={tag} className={styles.tag}>
              {tag}
              {!disabled && (
                <button
                  type="button"
                  className={styles.tagRemove}
                  onClick={() => removeTag(tag)}
                  aria-label={`Remove ${tag}`}
                >
                  <Icon name="times" size="xs" />
                </button>
              )}
            </span>
          ))}
        </div>
      )}
      <Input
        value={draft}
        onChange={(e) => setDraft(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder={placeholder}
        disabled={disabled}
      />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
  }),
  tags: css({
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
  }),
  tag: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.25),
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    borderRadius: theme.shape.radius.pill,
    backgroundColor: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.primary,
  }),
  tagRemove: css({
    display: 'inline-flex',
    alignItems: 'center',
    padding: 0,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: theme.colors.text.secondary,
    '&:hover': { color: theme.colors.text.primary },
  }),
});
