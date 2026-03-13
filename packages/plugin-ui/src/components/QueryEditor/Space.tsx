import React from 'react';
import { css, cx } from '@emotion/css';
import { type GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

export interface SpaceProps {
  v?: number;
  h?: number;
  layout?: 'block' | 'inline';
}

export const Space = ({ v = 0, h = 0, layout = 'block' }: SpaceProps) => {
  const styles = useStyles2(getStyles, v, h, layout);

  return <span className={cx(styles.wrapper)} />;
};

const getStyles = (theme: GrafanaTheme2, v: number, h: number, layout: 'block' | 'inline') => ({
  wrapper: css([
    {
      paddingRight: theme.spacing(h ?? 0),
      paddingBottom: theme.spacing(v ?? 0),
    },
    layout === 'inline' && {
      display: 'inline-block',
    },
    layout === 'block' && {
      display: 'block',
    },
  ]),
});
