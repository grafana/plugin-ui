import React from 'react';
import { GenericConfigSection, type Props as GenericConfigSectionProps } from './GenericConfigSection';

type Props = Omit<GenericConfigSectionProps, 'kind'>;

export const ConfigSection = ({ children, ...props }: React.PropsWithChildren<Props>) => {
  return (
    <GenericConfigSection {...props} kind="section">
      {children}
    </GenericConfigSection>
  );
};
