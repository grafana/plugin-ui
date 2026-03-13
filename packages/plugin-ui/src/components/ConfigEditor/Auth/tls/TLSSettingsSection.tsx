import React from 'react';
import { css } from '@emotion/css';
import { Checkbox, Tooltip, Icon, useTheme2 } from '@grafana/ui';

export type Props = {
  enabled: boolean;
  label: string;
  tooltipText: string;
  onToggle: (enabled: boolean) => void;
  readOnly: boolean;
};

export const TLSSettingsSection = ({
  children,
  enabled,
  label,
  tooltipText,
  onToggle,
  readOnly,
}: React.PropsWithChildren<Props>) => {
  const { colors, spacing } = useTheme2();
  const styles = {
    container: css({
      marginTop: 3,
    }),
    checkboxContainer: css({
      display: 'flex',
      alignItems: 'center',
    }),
    infoIcon: css({
      marginTop: -2,
      marginLeft: 5,
      color: colors.text.secondary,
    }),
    content: css({
      margin: spacing(1, 0, 2, 3),
    }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.checkboxContainer}>
        <Checkbox value={enabled} label={label} onChange={() => onToggle(!enabled)} disabled={readOnly} />
        <Tooltip placement="top" content={tooltipText} interactive>
          <Icon name="info-circle" className={styles.infoIcon} size="sm" />
        </Tooltip>
      </div>
      {enabled && children && <div className={styles.content}>{children}</div>}
    </div>
  );
};
