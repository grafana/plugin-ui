import React from 'react';
import { EditorStack } from '../EditorStack';

interface EditorRowsProps {
  children?: React.ReactNode;
}

export const EditorRows = ({ children }: EditorRowsProps) => {
  return (
    <EditorStack gap={0.5} direction="column">
      {children}
    </EditorStack>
  );
};
