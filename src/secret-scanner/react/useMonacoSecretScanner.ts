import { useEffect } from 'react';

import { installSecretScanner, type IStandaloneCodeEditor, type MonacoNamespace } from '../monaco/index';
import { useSecretScanner, type SecretScanner, type UseSecretScannerParams } from './useSecretScanner';

export interface UseMonacoSecretScannerParams extends UseSecretScannerParams {
  /** Monaco namespace + editor, injected from the host's editor mount. */
  monaco?: MonacoNamespace;
  editor?: IStandaloneCodeEditor;
  /** Whether the "Move to secret" quick fix is offered. Default true. */
  canMigrate?: boolean;
  /** Languages to register the quick fix for. Default: ts + js. */
  languages?: string[];
}

/**
 * Monaco adapter over {@link useSecretScanner}: adds gutter markers and a
 * "Move to Secrets Manager" quick fix on top of the headless scanner.
 *
 * The Monaco pieces are optional — until `monaco` and `editor` are both
 * provided, this behaves exactly like `useSecretScanner`, so a host can mount it
 * before its editor is ready.
 */
export function useMonacoSecretScanner(params: UseMonacoSecretScannerParams): SecretScanner {
  const { monaco, editor, canMigrate = true, languages, ...headless } = params;
  const { enabled = true, debounceMs, scan } = headless;

  const scanner = useSecretScanner(headless);
  const { request } = scanner.migration;

  const languageKey = (languages ?? []).join(',');
  useEffect(() => {
    if (monaco === undefined || editor === undefined) {
      return;
    }

    const installation = installSecretScanner(monaco, editor, {
      enabled,
      languages,
      debounceMs,
      scan,
      quickFix: canMigrate ? { run: request } : undefined,
    });

    return () => installation.dispose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monaco, editor, enabled, canMigrate, languageKey, debounceMs, scan, request]);

  return scanner;
}
