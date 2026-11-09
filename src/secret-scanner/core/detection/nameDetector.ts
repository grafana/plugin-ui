// cspell:ignore apikey creds
import type { DetectionResult } from './types';

// Variable / property names that, when assigned a string literal, suggest the
// value is a credential even when the value itself looks unremarkable (e.g.
// `const pass = 'hunter2'`). Matched per identifier *word* — split on
// camelCase / snake / kebab boundaries — so `apiKey` matches but `keyboard`,
// `author` and `monkey` do not.
const SENSITIVE_NAME_KEYWORDS = new Set([
  'password',
  'passwd',
  'passphrase',
  'pass',
  'pwd',
  'secret',
  'token',
  'apikey',
  'key',
  'auth',
  'bearer',
  'credential',
  'credentials',
  'cred',
  'creds',
  'session',
  'signature',
  'salt',
  'certificate',
  'cert',
]);

function splitIdentifierWords(name: string): string[] {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .map((word) => word.toLowerCase())
    .filter(Boolean);
}

function isSensitiveName(name: string): boolean {
  return splitIdentifierWords(name).some((word) => SENSITIVE_NAME_KEYWORDS.has(word));
}

// A name-based hit is low signal, so only flag compact single-token values that
// could plausibly be a credential — not sentences, URLs or empty strings.
function isPlausibleNamedSecretValue(value: string): boolean {
  return value.length >= 4 && value.length <= 200 && !/\s/.test(value) && !value.includes('://');
}

/**
 * Fallback for values that look unremarkable on their own, so an obvious
 * mistake like `const pass = 'function'` is still surfaced.
 */
export function detectFromName(body: string, name: string | undefined): DetectionResult | null {
  if (!isPlausibleNamedSecretValue(body)) {
    return null;
  }

  if (!name || !isSensitiveName(name)) {
    return null;
  }

  return {
    type: 'named',
    label: 'NAMED SECRET',
    confidence: 'low',
    secret: body,
  };
}
