/**
 * Text-first counterpart to {@link scanCode}: runs the same value-shape
 * detectors over raw text rather than over parsed string literals, which is what
 * a natural-language surface (a prompt, a description) needs — there the
 * credential is typed inline, not quoted as a JS string.
 *
 */
import { type EmbeddedMatch, findAllEmbedded } from './detection/embedded';
import { detectHighEntropy } from './detection/highEntropy';
import { isPlaceholder } from './detection/placeholders';
import { createPositionResolver } from './detection/position';
import type { SecretFinding } from './detection/types';
import { memoizeLatest } from './memoizeLatest';

// A run of high-entropy-alphabet characters, long enough to be a secret blob.
// The alphabet mirrors `detectHighEntropy` (no `-`/`_`, so kebab/snake config
// and identifiers aren't split into candidates), and the quotes/whitespace/
// punctuation around a token in prose delimit it.
const HIGH_ENTROPY_TOKEN = /[A-Za-z0-9+/=]{24,}/g;

function highEntropyMatches(text: string): EmbeddedMatch[] {
  const matches: EmbeddedMatch[] = [];
  HIGH_ENTROPY_TOKEN.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = HIGH_ENTROPY_TOKEN.exec(text)) !== null) {
    const token = m[0];
    if (isPlaceholder(token)) {
      continue;
    }
    const detected = detectHighEntropy(token);
    if (detected) {
      matches.push({ ...detected, index: m.index, length: token.length });
    }
  }
  return matches;
}

function scan(text: string): SecretFinding[] {
  const ruleMatches = findAllEmbedded(text);
  const overlapsRuleMatch = (m: EmbeddedMatch) =>
    ruleMatches.some((rule) => m.index < rule.index + rule.length && rule.index < m.index + m.length);

  const matches = [...ruleMatches, ...highEntropyMatches(text).filter((m) => !overlapsRuleMatch(m))].sort(
    (a, b) => a.index - b.index
  );

  const positionAt = createPositionResolver(text);
  return matches.map((match): SecretFinding => {
    const { line, column } = positionAt(match.index);
    return {
      id: `${match.index}-${match.type}`,
      type: match.type,
      label: match.label,
      confidence: match.confidence,
      secret: match.secret,
      range: { start: match.index, end: match.index + match.length },
      line,
      column,
    };
  });
}

/**
 * A text scanner with its own memo. Prefer this to the shared {@link scanText}
 * when more than one surface scans independently — see `memoizeLatest`.
 */
export function createTextScanner(): (text: string) => SecretFinding[] {
  return memoizeLatest(scan);
}

/** Shared text scanner, for a host with a single scanning surface. */
export const scanText = createTextScanner();
