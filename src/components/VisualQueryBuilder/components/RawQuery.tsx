import { css, cx } from '@emotion/css';
import Prism, { Grammar } from 'prismjs';
import React from 'react';

import { GrafanaTheme2, textUtil } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';

interface Props {
  query: string;
  language: {
    grammar: Grammar;
    name: string;
  };
  className?: string;
}
export function RawQuery({ query, language, className }: Props) {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const highlighted = Prism.highlight(query, language.grammar, language.name);

  return (
    <div
      className={cx(styles.editorField, 'prism-syntax-highlight', className)}
      aria-label="selector"
      dangerouslySetInnerHTML={{ __html: textUtil.sanitize(highlighted) }}
    />
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    editorField: css({
      fontFamily: theme.typography.fontFamilyMonospace,
      fontSize: theme.typography.bodySmall.fontSize,
    }),
  };
};
