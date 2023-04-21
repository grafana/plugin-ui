import React from "react";
import { css } from "@emotion/css";
import { Checkbox, Tooltip, Icon, useTheme2 } from "@grafana/ui";

type Props = {
  enabled: boolean;
  label: string;
  tooltipText: string;
  onToggle: (enabled: boolean) => void;
};

export const TLSSettingsSection: React.FC<Props> = ({
  children,
  enabled,
  label,
  tooltipText,
  onToggle,
}) => {
  const { colors, typography } = useTheme2();
  const styles = {
    container: css({
      marginTop: 3,
    }),
    checkboxContainer: css({
      display: "flex",
      alignItems: "center",
    }),
    checkbox: css({
      "*": {
        fontWeight: typography.fontWeightRegular,
      },
    }),
    infoIcon: css({
      marginTop: -2,
      marginLeft: 5,
      color: colors.text.secondary,
    }),
    content: css({
      margin: "8px 0 16px 24px",
    }),
  };

  return (
    <div className={styles.container}>
      <div className={styles.checkboxContainer}>
        <Checkbox
          value={enabled}
          label={label}
          onChange={() => onToggle(!enabled)}
          className={styles.checkbox}
        />
        <Tooltip placement="top" content={tooltipText}>
          <Icon name="info-circle" className={styles.infoIcon} size="sm" />
        </Tooltip>
      </div>
      {enabled && children && <div className={styles.content}>{children}</div>}
    </div>
  );
};
