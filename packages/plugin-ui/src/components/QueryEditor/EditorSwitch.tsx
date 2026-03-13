import React, { type ComponentProps } from 'react';
import { css } from '@emotion/css';
import { Switch } from '@grafana/ui';

// Wrapper component around <Switch /> that properly aligns it in <EditorField />
export const EditorSwitch = (props: ComponentProps<typeof Switch>) => {
  const styles = getStyles();

  return (
    <div className={styles.switch}>
      <Switch {...props} />
    </div>
  );
};

const getStyles = () => {
  return {
    switch: css({
      display: 'flex',
      alignItems: 'center',
      minHeight: 30,
    }),
  };
};
