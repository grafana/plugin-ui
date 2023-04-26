import React from "react";
import { TLSSettingsSection } from "./TLSSettingsSection";

export type Props = {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  readOnly: boolean;
};

export const SkipTLSVerification: React.FC<Props> = ({
  enabled,
  onToggle,
  readOnly,
}) => {
  return (
    <TLSSettingsSection
      enabled={enabled}
      label="Skip TLS certificate validation"
      tooltipText="Skipping TLS certificate validation is not recommended unless absolutely necessary or for testing"
      onToggle={(newEnabled) => onToggle(newEnabled)}
      readOnly={readOnly}
    />
  );
};
