import { useCallback, useEffect, useRef } from 'react';

import { type SQLQuery } from '../types';

import { formatSQL } from '../utils/formatSQL';
import { type LanguageCompletionProvider, SQLEditor } from '../../SQLEditor';
import type { SqlLanguage } from 'sql-formatter';

type Props = {
  query: SQLQuery;
  onChange: (value: SQLQuery, processQuery: boolean) => void;
  children?: (props: { formatQuery: () => void }) => React.ReactNode;
  width?: number;
  height?: number;
  completionProvider: LanguageCompletionProvider;
  language?: SqlLanguage;
};

export function QueryEditorRaw({
  children,
  onChange,
  query,
  width,
  height,
  completionProvider,
  language = 'sql',
}: Props) {
  // We need to pass query via ref to SQLEditor as onChange is executed via monacoEditor.onDidChangeModelContent callback, not onChange property
  const queryRef = useRef<SQLQuery>(query);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const onRawQueryChange = useCallback(
    (rawSql: string, processQuery: boolean) => {
      const newQuery = {
        ...queryRef.current,
        rawQuery: true,
        rawSql,
      };
      onChange(newQuery, processQuery);
    },
    [onChange]
  );

  return (
    <SQLEditor
      width={width}
      height={height}
      query={query.rawSql!}
      onChange={onRawQueryChange}
      language={{ id: 'sql', completionProvider, formatter: (q) => formatSQL(q, language) }}
    >
      {children}
    </SQLEditor>
  );
}
