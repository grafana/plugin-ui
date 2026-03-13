import React from 'react';
import { css } from '@emotion/css';
import { type GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { EditorStack } from '../EditorStack';

interface EditorRowProps {
  children?: React.ReactNode;
}

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
      borderRadius: theme.shape.borderRadius(1),
    }),
  };
};
