import React, { useState } from "react";
import { css } from "@emotion/css";
import { useTheme2, IconButton, IconName } from "@grafana/ui";

type Props = {
  title: string;
  description: string;
  isCollapsible?: boolean;
  isOpen?: boolean;
  kind?: "section" | "sub-section";
  className?: string;
};

export const ConfigSection: React.FC<Props> = ({
  children,
  title,
  description,
  isCollapsible = false,
  isOpen: isInitiallyOpen = true,
  kind = "section",
  className,
}) => {
  const { colors, typography } = useTheme2();
  const [isOpen, setIsOpen] = useState(isCollapsible ? isInitiallyOpen : true);
  const iconName: IconName = isOpen ? "angle-up" : "angle-down";

  const styles = {
    header: css({
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    }),
    subtitle: css({
      marginBottom: typography.pxToRem(4),
      fontWeight: typography.fontWeightRegular,
    }),
    descriptionText: css({
      ...typography.bodySmall,
      color: colors.text.secondary,
    }),
  };

  return (
    <div className={className}>
      <div className={styles.header}>
        {kind === "section" ? (
          <h3>{title}</h3>
        ) : (
          <h6 className={styles.subtitle}>{title}</h6>
        )}
        {isCollapsible && (
          <IconButton
            name={iconName}
            onClick={() => setIsOpen(!isOpen)}
            type="button"
          />
        )}
      </div>
      <p className={styles.descriptionText}>{description}</p>
      {isOpen && <div>{children}</div>}
    </div>
  );
};
