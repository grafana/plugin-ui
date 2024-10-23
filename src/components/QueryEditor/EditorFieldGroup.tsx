import React from 'react';
import { EditorStack } from './EditorStack';

interface EditorFieldGroupProps {
  children?: React.ReactNode;
}
/**
 * Uses Stack component from grafana-ui. Available starting from grafana-ui@10.2.3
 */
export const EditorFieldGroup = ({ children }: EditorFieldGroupProps) => {
  return <EditorStack gap={1}>{children}</EditorStack>;
};
