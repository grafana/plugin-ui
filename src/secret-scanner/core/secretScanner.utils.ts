import type { SecretFinding } from './detection/types';

const MAX_NAME_LENGTH = 253;

/**
 * Suggests a Secrets-store-compatible name for a finding. Secret names must be
 * lowercase and may only contain letters, numbers, dashes and periods (see
 * `secretSchema`), so we derive the suggestion from the detector type and
 * de-duplicate against existing names.
 */
export function suggestSecretName(finding: Pick<SecretFinding, 'type'>, existingNames: string[] = []): string {
  const base = `${finding.type}-secret`
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^[^a-z0-9]+/, '')
    .replace(/-+$/, '')
    .slice(0, MAX_NAME_LENGTH);

  const taken = new Set(existingNames);
  if (!taken.has(base)) {
    return base;
  }

  let suffix = 2;
  while (taken.has(`${base}-${suffix}`)) {
    suffix++;
  }
  return `${base}-${suffix}`;
}

export function maskSecret(secret: string): string {
  if (secret.length <= 8) {
    return '•'.repeat(secret.length);
  }
  return `${secret.slice(0, 3)}${'•'.repeat(4)}${secret.slice(-2)}`;
}

/**
 * Stable signature for remembering an "ignore" choice across edits and reloads.
 * Hashing (FNV-1a) keeps the plaintext out of local storage, and deriving it
 * from content rather than position keeps it stable when the secret moves —
 * unlike the finding `id`.
 */
export function getFindingSignature(finding: Pick<SecretFinding, 'type' | 'secret'>): string {
  return `${finding.type}.${fnv1aHash(`${finding.type}:${finding.secret}`)}`;
}

function fnv1aHash(value: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16);
}
