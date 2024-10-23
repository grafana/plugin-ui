import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';

import { useStyles2 } from '@grafana/ui';
import { EditorStack } from './EditorStack';

interface EditorRowProps {
  children?: React.ReactNode;
}
/**
 * Uses Stack component from grafana-ui. Available starting from grafana-ui@10.2.3
 */
export const EditorRow = ({ children }: EditorRowProps) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.root}>
      <EditorStack gap={2}>{children}</EditorStack>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    root: css({
      padding: theme.spacing(1),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
    }),
  };
};
