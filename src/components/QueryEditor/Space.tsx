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
  const styles = useStyles2(getStyles, { v, h, layout });

  return <span className={cx(styles.wrapper)} />;
};

const getStyles = (theme: GrafanaTheme2, props: SpaceProps) => ({
  wrapper: css([
    {
      paddingRight: theme.spacing(props.h ?? 0),
      paddingBottom: theme.spacing(props.v ?? 0),
    },
    props.layout === 'inline' && {
      display: 'inline-block',
    },
    props.layout === 'block' && {
      display: 'block',
    },
  ]),
});
