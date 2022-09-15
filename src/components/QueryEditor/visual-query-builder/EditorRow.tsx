import { css } from '@emotion/css';
import React from 'react';

import { GrafanaTheme2 } from '@grafana/data';

import { Stack } from './Stack';
import { useStyles2 } from '@grafana/ui';

interface EditorRowProps {}

export const EditorRow: React.FC<EditorRowProps> = ({ children }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.root}>
      <Stack gap={2}>{children}</Stack>
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
