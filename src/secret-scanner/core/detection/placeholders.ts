// cspell:ignore changeme

// Values that look secret-shaped but are obviously placeholders. Skipping these
// keeps the warning noise down so the real findings stand out.
const PLACEHOLDER_PATTERN =
  /^(your|my|the|some|example|sample|changeme|placeholder|todo|xxx+|test|dummy|<.*>|\{\{.*\}\})/i;

export function isPlaceholder(value: string): boolean {
  if (PLACEHOLDER_PATTERN.test(value)) {
    return true;
  }

  // A single repeated character (aaaa…, xxxx…, 0000…) is never a real secret.
  return /^(.)\1+$/.test(value);
}
