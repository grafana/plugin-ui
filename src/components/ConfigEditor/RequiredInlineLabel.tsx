import React from "react";
import { css } from "@emotion/css";
import { useTheme2, InlineLabel } from "@grafana/ui";

type Props = React.ComponentProps<typeof InlineLabel>;

export const RequiredInlineLabel: React.FC<Props> = ({
  children,
  ...props
}) => {
  const theme = useTheme2();

  const styles = {
    asterisk: css`
      color: ${theme.colors.error.main};
    `,
  };

  return (
    <InlineLabel {...props}>
      <span>
        {children}&nbsp;<span className={styles.asterisk}>*</span>
      </span>
    </InlineLabel>
  );
};
