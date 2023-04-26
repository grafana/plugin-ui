import React from "react";
import {
  GenericConfigSection,
  Props as GenericConfigSectionProps,
} from "./GenericConfigSection";

type Props = Omit<GenericConfigSectionProps, "kind">;

export const ConfigSubSection: React.FC<Props> = ({ children, ...props }) => {
  return (
    <GenericConfigSection {...props} kind="sub-section">
      {children}
    </GenericConfigSection>
  );
};
