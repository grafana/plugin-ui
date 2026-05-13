import React, { useState } from 'react';
import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Button, Input, Icon } from '@grafana/ui';
import { SECURE_FIELD_CONFIGURED } from '../../datasource/schema/datasource';

export type FormFieldRef = {
  onChange: (v: unknown) => void;
  onBlur: () => void;
  value: unknown;
  name: string;
};

export function SecureFieldInput({
  formField,
  placeholder,
  disabled,
  label,
}: {
  formField: FormFieldRef;
  placeholder?: string;
  disabled?: boolean;
  label: string;
}) {
  const isConfigured = formField.value === SECURE_FIELD_CONFIGURED;
  const [revealed, setRevealed] = useState(false);
  const styles = useStyles2(getSecureFieldStyles);

  if (isConfigured) {
    return (
      <div className={styles.configuredRow}>
        <span className={styles.configuredBadge}>
          <Icon name="lock" size="xs" />
          {label} configured
        </span>
        {!disabled && (
          <Button variant="secondary" fill="text" size="sm" onClick={() => formField.onChange('')} type="button">
            Reset
          </Button>
        )}
      </div>
    );
  }

  return (
    <Input
      {...formField}
      value={String(formField.value ?? '')}
      type={revealed ? 'text' : 'password'}
      placeholder={placeholder}
      disabled={disabled}
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
  );
}

export const getSecureFieldStyles = (theme: GrafanaTheme2) => ({
  configuredRow: css({
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(1),
  }),
  configuredBadge: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: `${theme.spacing(0.25)} ${theme.spacing(0.75)}`,
    borderRadius: theme.shape.radius.pill,
    backgroundColor: theme.colors.success.transparent,
    color: theme.colors.success.text,
    fontSize: theme.typography.bodySmall.fontSize,
  }),
});
