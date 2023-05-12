/**
 * Copy & paste from https://github.com/grafana/grafana/blob/main/packages/grafana-ui/src/components/SecretInput/SecretInput.tsx
 * Available starting from @grafana/ui 9.2
 */

import * as React from "react";
import { HorizontalGroup, Input, Button } from "@grafana/ui";

export type Props = React.ComponentProps<typeof Input> & {
  /** TRUE if the secret was already configured. (It is needed as often the backend doesn't send back the actual secret, only the information that it was configured) */
  isConfigured: boolean;
  /** Called when the user clicks on the "Reset" button in order to clear the secret */
  onReset: () => void;
};

export const CONFIGURED_TEXT = "configured";
export const RESET_BUTTON_TEXT = "Reset";

export const SecretInput = ({ isConfigured, onReset, ...props }: Props) => (
  <HorizontalGroup>
    {!isConfigured && <Input {...props} type="password" />}
    {isConfigured && (
      <Input {...props} type="text" disabled={true} value={CONFIGURED_TEXT} />
    )}
    {isConfigured && (
      <Button onClick={onReset} variant="secondary">
        {RESET_BUTTON_TEXT}
      </Button>
    )}
  </HorizontalGroup>
);
