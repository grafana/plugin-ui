import type { SecretFinding } from './detection/types';

export interface ApplyResult {
  text: string;
  addedImport: boolean;
  needsAsync: boolean;
  applied: boolean;
}

/**
 * Turns a finding into a reference to a managed secret
 *
 * Implement this to target something other than k6; pass it to
 * `useSecretScanner` (or call it directly). {@link k6SecretRewriter} is the
 * default.
 */
export interface SecretRewriter {
  apply(text: string, finding: SecretFinding, secretName: string): ApplyResult;
  reference(secretName: string, binding?: string): string;
}
