import { css } from '@emotion/css';

import { type GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';

import { EditorStack } from '../../QueryEditor';

export function OperationsEditorRow({ children }: React.PropsWithChildren<{}>) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.root}>
      <EditorStack gap={1}>{children}</EditorStack>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    root: css({
      padding: theme.spacing(1, 1, 0, 1),
      backgroundColor: theme.colors.background.secondary,
      borderRadius: theme.shape.radius.default,
    }),
  };
};
