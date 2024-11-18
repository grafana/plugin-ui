import { css } from '@emotion/css';
import React, { CSSProperties } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { useTheme2, stylesFactory } from '@grafana/ui';

interface StackProps {
  children?: React.ReactNode;
  direction?: CSSProperties['flexDirection'];
  alignItems?: CSSProperties['alignItems'];
  wrap?: boolean;
  gap?: number;
}
/**
 * @deprecated use the EditorStack component
 */
export const Stack = ({ children, ...props }: StackProps) => {
  const theme = useTheme2();
  const styles = useStyles(theme, props);

  return <div className={styles.root}>{children}</div>;
};

const useStyles = stylesFactory((theme: GrafanaTheme2, props: StackProps) => ({
  root: css({
    display: 'flex',
    flexDirection: props.direction ?? 'row',
    flexWrap: (props.wrap ?? true) ? 'wrap' : undefined,
    alignItems: props.alignItems,
    gap: theme.spacing(props.gap ?? 2),
  }),
}));
