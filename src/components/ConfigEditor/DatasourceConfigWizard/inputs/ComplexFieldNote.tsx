import React from 'react';
import { css } from '@emotion/css';
import { type GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Icon } from '@grafana/ui';
import type { FieldInputProps } from './types';

type Props = { count: number; label: string };

export function ComplexInput({ field, formField }: FieldInputProps) {
  const label = field.label ?? field.key;
  const count = Array.isArray(formField.value) ? formField.value.length : 0;
  return <ComplexFieldNote count={count} label={label} />;
}

const ComplexFieldNote = (props: Props) => {
  const { count, label } = props;
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.note}>
      <Icon name="info-circle" size="xs" />
      <span>
        {count > 0 ? `${count} ${label.toLowerCase()} configured.` : `No ${label.toLowerCase()} configured.`} Configure
        in Grafana UI.
      </span>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  note: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
});
