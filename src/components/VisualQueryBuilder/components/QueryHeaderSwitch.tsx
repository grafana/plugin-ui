import { css } from '@emotion/css';
import { uniqueId } from 'lodash';
import { type HTMLProps, useRef } from 'react';

import { type GrafanaTheme2 } from '@grafana/data';
import { Switch, useStyles2 } from '@grafana/ui';

import { EditorStack } from '../../QueryEditor';

interface Props extends Omit<HTMLProps<HTMLInputElement>, 'value' | 'ref'> {
  value?: boolean;
  label: string;
}

export function QueryHeaderSwitch({ label, ...inputProps }: Props) {
  const dashedLabel = label.replace(' ', '-');
  const switchIdRef = useRef(uniqueId(`switch-${dashedLabel}`));
  const styles = useStyles2(getStyles);

  return (
    <EditorStack gap={1}>
      <label htmlFor={switchIdRef.current} className={styles.switchLabel}>
        {label}
      </label>
      <Switch {...inputProps} id={switchIdRef.current} />
    </EditorStack>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    switchLabel: css({
      color: theme.colors.text.secondary,
      cursor: 'pointer',
      fontSize: theme.typography.bodySmall.fontSize,
      '&:hover': {
        color: theme.colors.text.primary,
      },
    }),
  };
};
