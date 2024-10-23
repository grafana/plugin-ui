import React from 'react';
import { EditorStack } from './EditorStack';

interface EditorRowsProps {
  children?: React.ReactNode;
}
/**
 * Uses Stack component from @grafana/ui. Available starting from @grafana/ui@10.2.3
 */
export const EditorRows = ({ children }: EditorRowsProps) => {
  return (
    <EditorStack gap={0.5} direction="column">
      {children}
    </EditorStack>
  );
};
