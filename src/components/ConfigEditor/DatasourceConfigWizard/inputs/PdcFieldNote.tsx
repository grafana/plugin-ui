import React from 'react';
import { css } from '@emotion/css';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, Icon, Tooltip, LinkButton } from '@grafana/ui';

type Props = {
  enabled: boolean;
  description?: string;
  configUrl: string;
};

export const PdcFieldNote = (props: Props) => {
  const { enabled, description, configUrl } = props;
  const styles = useStyles2(getStyles);
  return (
    <div className={styles.wrapper}>
      <div className={styles.note}>
        <Icon name="shield" size="xs" />
        <span>
          Private data source connect: <strong>{enabled ? 'Enabled' : 'Disabled'}</strong>
        </span>
        {description && (
          <Tooltip content={description}>
            <Icon name="info-circle" size="xs" />
          </Tooltip>
        )}
      </div>
      <LinkButton variant="secondary" size="sm" icon="external-link-alt" href={configUrl}>
        Configure in settings
      </LinkButton>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(1),
    padding: `${theme.spacing(0.5)} ${theme.spacing(0.75)}`,
    fontSize: theme.typography.bodySmall.fontSize,
    color: theme.colors.text.secondary,
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.shape.radius.default,
    border: `1px solid ${theme.colors.border.weak}`,
  }),
  note: css({
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  }),
});
