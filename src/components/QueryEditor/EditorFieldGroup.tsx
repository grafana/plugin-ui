import React from 'react';
import { EditorStack } from './EditorStack';

interface EditorFieldGroupProps {
  children?: React.ReactNode;
}

export const EditorFieldGroup = ({ children }: EditorFieldGroupProps) => {
  return <EditorStack gap={1}>{children}</EditorStack>;
};
