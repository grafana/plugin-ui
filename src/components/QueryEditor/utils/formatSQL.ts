import { format, type SqlLanguage } from 'sql-formatter';

/**
 * Format SQL while preserving Grafana template variable tokens.
 * Treats `${...}`, `$__...`, and `$var` as parameters so the
 * formatter does not split or reflow them, then normalizes any
 * whitespace inside those tokens.
 */
export function formatSQL(q: string, language: SqlLanguage = 'sql') {
  const formatted = format(q, {
    language,
    paramTypes: {
      custom: [
        {
          regex: '\\$\\s*\\{[^}]*\\}|\\$\\s*__\\w+(?:\\([^)]*\\))?|\\$\\s*\\w+',
        },
      ],
    },
  });
  return formatted.replace(/(\$\s*\{[^}]*\})|(\$\s*__\w+(?:\([^)]*\))?)|(\$\s*\w+)/g, (m: string) =>
    m.replace(/\s/g, '')
  );
}
