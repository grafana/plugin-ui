# Secret scanner

Set of utilities and components to detect secrets in a Monaco Editor or a generic string input.

## Usage with a Monaco editor

```tsx
import {
  useMonacoSecretScanner,
  SecretScannerPanel,
  SecretReferenceModal,
  suggestSecretName,
} from '@grafana/plugin-ui/secret-scanner';

function Editor({ monaco, editor, value, setValue, readOnly, secretsAvailable }) {
  const scanner = useMonacoSecretScanner({
    monaco, // from your CodeEditor's onEditorDidMount(editor, monaco)
    editor,
    text: value,
    onChange: setValue,
    enabled: secretsAvailable,
    canMigrate: !readOnly,
  });

  return (
    <>
      <SecretScannerPanel scanner={scanner} readOnly={readOnly} hidden={!secretsAvailable} />

      {/* Open your create-secret modal from `scanner.migration.finding`, then
          call `scanner.migration.apply(finding, secretName)` on success. */}

      <SecretReferenceModal reference={scanner.reference.pending} onDismiss={scanner.reference.dismiss} />
    </>
  );
}
```

`monaco` and `editor` are optional. Until both are supplied the hook behaves
exactly like `useSecretScanner` — useful while an editor is still mounting.

## Usage without an editor

`useSecretScanner` is the same hook without the Monaco wiring. It accepts any
string, and the detection strategy is swappable:

```tsx
import { useSecretScanner, createTextScanner, SecretFindingsPanel } from '@grafana/plugin-ui/secret-scanner';

function PromptField({ value, setValue }) {
  const scan = useMemo(() => createTextScanner(), []);
  const scanner = useSecretScanner({ text: value, scan, onChange: setValue });

  return <SecretFindingsPanel findings={scanner.findings} onIgnore={scanner.ignore} showLine={false} />;
}
```

Detection also works standalone, without React:

```ts
import { scanText, suggestSecretName } from '@grafana/plugin-ui/secret-scanner';

for (const finding of scanText(anyText)) {
  // finding.secret includes [finding.range.start, finding.range.end]
  const name = suggestSecretName(finding, existingSecretNames);
}
```

## Hook options

| Option             | Default                         | Description                                                        |
| ------------------ | ------------------------------- | ------------------------------------------------------------------ |
| `text`             | —                               | The string to scan. Controlled by the caller.                      |
| `scan`             | a private `createCodeScanner()` | Detection strategy. Pass `createTextScanner()` for prose.          |
| `rewriter`         | `k6SecretRewriter`              | How an accepted finding is rewritten. See [Migration](#migration). |
| `onChange`         | —                               | Receives the rewritten text. Omit on read-only surfaces.           |
| `enabled`          | `true`                          | When false, no scanning runs and `findings` is empty.              |
| `ignoreStorageKey` | `secretScanner.ignored`         | localStorage key for dismissals. Namespace it per document.        |
| `debounceMs`       | `1500`                          | Delay between an edit and the re-scan it triggers.                 |

`useMonacoSecretScanner` accepts all of the above plus `monaco`, `editor`,
`canMigrate` (default `true`) and `languages` (default TypeScript and JavaScript).

## Hook result

```ts
{
  findings,   // SecretFinding[] — detected, minus dismissed
  ignore,     // (finding) => void
  migration,  // { finding, request, cancel, apply } — drives your create-secret modal
  reference,  // { pending, dismiss }                — drives <SecretReferenceModal>
}
```

`migration` and `reference` each model one modal: a nullable value for what is
currently open, plus its transitions. A surface that renders neither modal can
use `findings` and `ignore` alone.

## Findings

Every scanner returns the same `SecretFinding`, so panels, dismissal state and
editor adapters do not branch on which scanner produced it.

| Field             | Description                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------- |
| `id`              | Stable key for React lists. Derived from position, so it changes when the secret moves.        |
| `type` / `label`  | A type key (`jwt`) and display label (`JWT`).                                                  |
| `confidence`      | `high`, `medium` or `low`.                                                                     |
| `secret`          | The detected value.                                                                            |
| `range`           | The span of the secret value. Always present.                                                  |
| `line` / `column` | Position of `range.start`.                                                                     |
| `literal`         | Code scans only: the enclosing string literal, quotes included.                                |
| `rewrite`         | Code scans only. See [Migration](#migration). Undefined means no in-place rewrite is possible. |

### Choosing `scanCode` or `scanText`

`scanCode` parses the input as a script and inspects only the contents of string
literals, so a credential written in a comment or in prose is not flagged. Use it
for code editors.

`scanText` runs the same detectors over raw text, with no parsing. Use it for
natural-language surfaces such as prompts and descriptions. Its findings carry no
`literal` and no `rewrite`, because prose has no enclosing literal and no
unambiguous in-place replacement.

Each has a `create*Scanner()` factory that returns an independent instance.
Prefer the factory when a page has more than one scanning surface; the shared
`scanCode` and `scanText` exports are convenient for a single surface, but all
callers share one cache, so alternating between different strings loses its
benefit.

## Migration

Detection is runtime-agnostic; rewriting is not. A `SecretRewriter` owns the
import syntax, the accessor expression and the module specifier. The default is
`k6SecretRewriter`, which targets k6 Secrets Management (`await secrets.get('name')`).

To target a different runtime, pass a rewriter to the hook:

```ts
const myRewriter: SecretRewriter = {
  apply(text, finding, secretName) {
    /* … */
  },
  reference: (secretName) => `env.get("${secretName}")`,
};
```

Each code finding carries a `rewrite` mode describing what can be replaced:

- **`literal`** — the whole literal is the secret; the enclosing `literal` range is replaced.
- **`template-interpolation`** — a token inside a template literal; only `range` is replaced, with an interpolation.
- **`none`** — embedded in a plain quoted string; no unambiguous rewrite exists.

Four cases produce no rewrite: `rewrite: 'none'`, a text-scan finding (`rewrite`
undefined), a range that no longer matches because the text changed while the
modal was open, and a hook configured without `onChange`. All four behave the
same way — the secret is still created, and `reference.pending` is populated so
`SecretReferenceModal` can offer the reference to paste by hand.

## Exports

| Export                                                             | Purpose                                                        |
| ------------------------------------------------------------------ | -------------------------------------------------------------- |
| `useSecretScanner`                                                 | Headless hook: `findings`, `ignore`, `migration`, `reference`. |
| `useMonacoSecretScanner`                                           | The same, plus gutter markers and a quick fix.                 |
| `installSecretScanner`                                             | The Monaco wiring alone, for non-React hosts.                  |
| `SecretScannerPanel` / `SecretFindingsPanel`                       | Panels listing findings with move and ignore actions.          |
| `SecretReferenceModal`                                             | Modal with a copyable reference snippet.                       |
| `scanCode` / `scanText`                                            | Detection, standalone.                                         |
| `createCodeScanner` / `createTextScanner`                          | Independent scanner instances.                                 |
| `k6SecretRewriter`, `applySecretReference`, `buildSecretReference` | The default k6 rewriter.                                       |
| `suggestSecretName`, `maskSecret`                                  | Helpers for naming and displaying a finding.                   |

## How detection works

Both scanners share the same value-shape detectors, compiled from two rule sets:

1. The [gitleaks](https://github.com/gitleaks/gitleaks) default configuration, vendored as [`rules/gitleaks.toml`](./rules/gitleaks.toml). MIT licensed — see [`rules/gitleaks-LICENSE`](./rules/gitleaks-LICENSE) and the repository `NOTICE`.
2. A tuned set of patterns in [`rules/custom.toml`](./rules/custom.toml), which takes precedence where the two overlap.

They differ in what those detectors are run against. `scanCode` parses the input
to an AST and scans each string and template literal, so reported ranges align
with the original source even across escape sequences. `scanText` skips parsing
and scans the raw text.

Both then apply a Shannon-entropy heuristic to catch opaque tokens that match no
rule. `scanCode` adds one further pass that `scanText` cannot: a low-confidence
check on the variable or property name a literal is assigned to, which flags
cases like `const password = 'hunter2'` where the value alone looks ordinary.

## Contributing

Neither TOML file is imported at runtime. `yarn gen:secret-rules` parses both and
writes [`rules/rules.generated.ts`](./rules/rules.generated.ts), which is checked
in and is what the detectors import. After editing either `.toml`, re-run the
generator and commit the result.
