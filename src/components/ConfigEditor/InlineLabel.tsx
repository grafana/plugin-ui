import React from "react";
import { css } from "@emotion/css";
import { useTheme2, InlineLabel as OriginalInlineLabel } from "@grafana/ui";

type Props = React.ComponentProps<typeof OriginalInlineLabel> & {
  required?: boolean;
};

export const InlineLabel: React.FC<Props> = ({
  children,
  required = false,
  ...props
}) => {
  const theme = useTheme2();

  const styles = {
    asterisk: css`
      color: ${theme.colors.error.main};
    `,
  };

  return (
    <OriginalInlineLabel {...props}>
      <span>
        {children}
        {required && (
          <>
            &nbsp;<span className={styles.asterisk}>*</span>
          </>
        )}
      </span>
    </OriginalInlineLabel>
  );
};
