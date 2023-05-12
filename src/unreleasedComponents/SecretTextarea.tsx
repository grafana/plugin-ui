/**
 * Copy & paste from https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/SecretTextArea/SecretTextArea.tsx
 * Available starting from @grafana/ui 9.2
 */

import { css, cx } from "@emotion/css";
import * as React from "react";

import { GrafanaTheme2 } from "@grafana/data";
import { useStyles2, Button, TextArea, HorizontalGroup } from "@grafana/ui";

export type Props = React.ComponentProps<typeof TextArea> & {
  /** TRUE if the secret was already configured. (It is needed as often the backend doesn't send back the actual secret, only the information that it was configured) */
  isConfigured: boolean;
  /** Called when the user clicks on the "Reset" button in order to clear the secret */
  onReset: () => void;
};

export const CONFIGURED_TEXT = "configured";
export const RESET_BUTTON_TEXT = "Reset";

const getStyles = (theme: GrafanaTheme2) => {
  return {
    configuredStyle: css`
      min-height: ${theme.spacing(theme.components.height.md)};
      padding-top: ${
        theme.spacing(
          0.5
        ) /** Needed to mimic vertically centered text in an input box */
      };
      resize: none;
    `,
  };
};

/**
 * Text area that does not disclose an already configured value but lets the user reset the current value and enter a new one.
 * Typically useful for asymmetric cryptography keys.
 */
export const SecretTextArea = ({ isConfigured, onReset, ...props }: Props) => {
  const styles = useStyles2(getStyles);
  return (
    <HorizontalGroup>
      {!isConfigured && <TextArea {...props} />}
      {isConfigured && (
        <TextArea
          {...props}
          rows={1}
          disabled={true}
          value={CONFIGURED_TEXT}
          className={cx(styles.configuredStyle)}
        />
      )}
      {isConfigured && (
        <Button onClick={onReset} variant="secondary">
          {RESET_BUTTON_TEXT}
        </Button>
      )}
    </HorizontalGroup>
  );
};
