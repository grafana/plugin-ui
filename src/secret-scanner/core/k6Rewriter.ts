/**
 * The k6 {@link SecretRewriter}: rewrites a detected hardcoded secret into a
 * reference to the managed Secrets store, matching the syntax documented in the
 * in-product Secrets guide:
 *
 *   import secrets from 'k6/secrets'
 *   const value = await secrets.get('my-secret')
 *
 * This is the only k6-specific piece of the library. Everything else — the
 * detectors, the finding shape, the hooks, the panel — is runtime-agnostic.
 */
import type { SecretFinding } from './detection/types';
import type { ApplyResult, SecretRewriter } from './rewrite';

const SECRETS_MODULE = 'k6/secrets';

function findSecretsBinding(script: string): string | null {
  const match = script.match(/import\s+([A-Za-z_$][\w$]*)\s+from\s+['"]k6\/secrets['"]/);
  return match?.[1] ?? null;
}

export function buildSecretReference(secretName: string, binding = 'secrets'): string {
  return `await ${binding}.get('${secretName}')`;
}

function ensureSecretsImport(script: string): {
  script: string;
  binding: string;
  addedImport: boolean;
} {
  const existing = findSecretsBinding(script);
  if (existing) {
    return { script, binding: existing, addedImport: false };
  }

  const importLine = `import secrets from '${SECRETS_MODULE}'\n`;
  return {
    script: `${importLine}${script}`,
    binding: 'secrets',
    addedImport: true,
  };
}

export function applySecretReference(script: string, finding: SecretFinding, secretName: string): ApplyResult {
  if (finding.rewrite === undefined || finding.rewrite === 'none') {
    return { text: script, addedImport: false, needsAsync: false, applied: false };
  }

  const target = finding.rewrite === 'literal' ? (finding.literal ?? finding.range) : finding.range;

  // Guard against stale offsets. `finding` is a snapshot; if the script moved
  // under it (auto-format, autosave, or a host migrating several findings from
  // one captured array), the recorded range may no longer contain this secret.
  if (!script.slice(target.start, target.end).includes(finding.secret)) {
    return { text: script, addedImport: false, needsAsync: false, applied: false };
  }

  const binding = findSecretsBinding(script) ?? 'secrets';
  const reference =
    finding.rewrite === 'template-interpolation'
      ? `\${await ${binding}.get('${secretName}')}`
      : buildSecretReference(secretName, binding);

  const replaced = script.slice(0, target.start) + reference + script.slice(target.end);

  const { script: withImport, addedImport } = ensureSecretsImport(replaced);

  return { text: withImport, addedImport, needsAsync: true, applied: true };
}

export const k6SecretRewriter: SecretRewriter = {
  apply: applySecretReference,
  reference: buildSecretReference,
};
