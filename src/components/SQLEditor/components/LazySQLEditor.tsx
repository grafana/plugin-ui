import { css } from '@emotion/css';
import { lazy, Suspense } from 'react';
import { LoadingPlaceholder, useStyles2 } from '@grafana/ui';

import type { GrafanaTheme2 } from '@grafana/data';
import type { SQLEditorProps } from './SQLEditor';

const QueryEditor = lazy(() => import('./SQLEditor'));

export function LazySQLEditor(props: SQLEditorProps) {
  const styles = useStyles2(getStyles);

  return (
    <Suspense fallback={<LoadingPlaceholder text={'Loading editor'} className={styles.container} />}>
      <QueryEditor {...props} />
    </Suspense>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    container: css({
      marginBottom: 'unset',
      marginLeft: theme.spacing(1),
    }),
  };
};
