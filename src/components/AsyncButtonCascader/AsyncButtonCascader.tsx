import React from 'react';
import { Icon } from '@grafana/ui';
import { css, cx } from '@emotion/css';

// @ts-ignore
import RCCascader, { CascaderOption } from 'rc-cascader';
import { useTheme2 } from '@grafana/ui';
import { GrafanaTheme2 } from '@grafana/data';

export interface AsyncButtonCascaderProps {
  options: CascaderOption[];
  children: string;
  disabled?: boolean;
  value: string[];
  fieldNames?: { label: string; value: string; children: string };
  loadData?: (selectedOptions: CascaderOption[]) => void;
  onChange?: (value: string[], selectedOptions: CascaderOption[]) => void;
  onPopupVisibleChange?: (visible: boolean) => void;
  className?: string;
}

const getStyles = ((theme: GrafanaTheme2) => {
  return {
    popup: css`
      label: popup;
      z-index: ${theme.zIndex.dropdown};
    `,
    icon: css`
      margin: 1px 0 0 4px;
    `,
  };
});

export const AsyncButtonCascader: React.FC<AsyncButtonCascaderProps> = props => {
  const { onChange, className, loadData, ...rest } = props;
  const theme = useTheme2();
  const styles = getStyles(theme);

  return (
    <RCCascader
      onChange={onChange}
      loadData={loadData}
      changeOnSelect={true}
      popupClassName={styles.popup}
      {...rest}
      expandIcon={null}
    >
      <button className={cx('gf-form-label', className)} disabled={props.disabled}>
        {props.children} <Icon name="angle-down" className={styles.icon} />
      </button>
    </RCCascader>
  );
};

AsyncButtonCascader.displayName = 'AsyncButtonCascader';
