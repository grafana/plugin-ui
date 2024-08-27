import React from 'react';

import { Stack } from './Stack';

interface EditorFieldGroupProps {
  children?: React.ReactNode;
}

export const EditorFieldGroup = ({ children }: EditorFieldGroupProps) => {
  return <Stack gap={1}>{children}</Stack>;
};
