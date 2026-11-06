import { createCodeScanner, DEFAULT_DEBOUNCE_MS, type SecretFinding } from '../core/index';
import type { IStandaloneCodeEditor, MonacoNamespace } from './types';

/** Marker `code` identifying the scanner's diagnostics for the quick fix. */
export const SECRET_MARKER_CODE = 'hardcoded-secret';

const MARKER_OWNER = 'secret-scanner';
const DEFAULT_LANGUAGES = ['typescript', 'javascript'];
const DEFAULT_QUICK_FIX_TITLE = 'Move to Secrets Manager';

export interface InstallSecretScannerOptions {
  languages?: string[];
  enabled?: boolean;
  markerMessage?: (finding: SecretFinding) => string;
  quickFix?: { title?: string; run: (finding: SecretFinding) => void };
  scan?: (code: string) => SecretFinding[];
  debounceMs?: number;
}

export interface SecretScannerInstallation {
  refresh(): void;
  dispose(): void;
}

/**
 * Gutter markers for detected secrets plus an optional "Move to Secrets Manager"
 * quick fix.
 */
export function installSecretScanner(
  monaco: MonacoNamespace,
  editor: IStandaloneCodeEditor,
  options: InstallSecretScannerOptions = {}
): SecretScannerInstallation {
  const languages = options.languages ?? DEFAULT_LANGUAGES;
  const scan = options.scan ?? createCodeScanner();
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const markerMessage =
    options.markerMessage ??
    ((finding: SecretFinding) =>
      `Possible hardcoded secret (${finding.label}). Consider moving it to a managed secret.`);

  const disposables: Array<{ dispose(): void }> = [];

  const updateMarkers = () => {
    const model = editor.getModel();
    if (model === null) {
      return;
    }

    if (options.enabled === false) {
      monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
      return;
    }

    const script = model.getValue();
    const markers = scan(script).map((finding) => {
      const start = model.getPositionAt(finding.range.start);
      const end = model.getPositionAt(finding.range.end);
      return {
        severity: monaco.MarkerSeverity.Warning,
        message: markerMessage(finding),
        code: SECRET_MARKER_CODE,
        startLineNumber: start.lineNumber,
        startColumn: start.column,
        endLineNumber: end.lineNumber,
        endColumn: end.column,
      };
    });

    monaco.editor.setModelMarkers(model, MARKER_OWNER, markers);
  };

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;
  const cancelScheduled = () => {
    if (debounceTimer !== undefined) {
      clearTimeout(debounceTimer);
      debounceTimer = undefined;
    }
  };
  const scheduleUpdate = () => {
    cancelScheduled();
    debounceTimer = setTimeout(() => {
      debounceTimer = undefined;
      updateMarkers();
    }, debounceMs);
  };
  const updateNow = () => {
    cancelScheduled();
    updateMarkers();
  };

  updateMarkers();
  disposables.push(editor.onDidChangeModelContent(() => scheduleUpdate()));
  disposables.push(editor.onDidChangeModel(() => updateNow()));
  disposables.push({ dispose: cancelScheduled });

  if (options.enabled !== false && options.quickFix) {
    const runQuickFix = options.quickFix.run;
    const title = options.quickFix.title ?? DEFAULT_QUICK_FIX_TITLE;

    const commandId = editor.addCommand(0, (_accessor: unknown, finding: SecretFinding) => runQuickFix(finding));

    if (commandId) {
      for (const language of languages) {
        disposables.push(
          monaco.languages.registerCodeActionProvider(language, {
            provideCodeActions(model, _range, context) {
              const secretMarkers = context.markers.filter((marker) => marker.code === SECRET_MARKER_CODE);

              if (secretMarkers.length === 0) {
                return { actions: [], dispose() {} };
              }

              const findings = scan(model.getValue());
              const actions = secretMarkers.flatMap((marker) => {
                const markerOffset = model.getOffsetAt({
                  lineNumber: marker.startLineNumber,
                  column: marker.startColumn,
                });
                const finding = findings.find((candidate) => candidate.range.start === markerOffset);

                if (finding === undefined) {
                  return [];
                }

                return [
                  {
                    title,
                    kind: 'quickfix',
                    diagnostics: [marker],
                    command: { id: commandId, title, arguments: [finding] },
                  },
                ];
              });

              return { actions, dispose() {} };
            },
          })
        );
      }
    }
  }

  return {
    refresh: updateNow,
    dispose() {
      disposables.forEach((disposable) => disposable.dispose());
      const model = editor.getModel();
      if (model !== null) {
        monaco.editor.setModelMarkers(model, MARKER_OWNER, []);
      }
    },
  };
}
