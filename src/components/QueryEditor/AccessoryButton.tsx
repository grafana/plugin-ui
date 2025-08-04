import { css, cx } from '@emotion/css';
import React from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Button, type ButtonProps, useStyles2 } from '@grafana/ui';

type AccessoryButtonProps = ButtonProps & {};

export const AccessoryButton = ({ className, ...props }: AccessoryButtonProps) => {
  const styles = useStyles2(getButtonStyles);

  return <Button {...props} className={cx(className, styles.button)} />;
};

const getButtonStyles = (theme: GrafanaTheme2) => ({
  button: css({
    paddingLeft: theme.spacing(3 / 2),
    paddingRight: theme.spacing(3 / 2),
  }),
});
