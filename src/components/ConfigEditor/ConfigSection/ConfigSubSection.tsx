import React from 'react';
import { GenericConfigSection, type Props as GenericConfigSectionProps } from './GenericConfigSection';

type Props = Omit<GenericConfigSectionProps, 'kind'>;

export const ConfigSubSection = ({ children, ...props }: React.PropsWithChildren<Props>) => {
  return (
    <GenericConfigSection {...props} kind="sub-section">
      {children}
    </GenericConfigSection>
  );
};
