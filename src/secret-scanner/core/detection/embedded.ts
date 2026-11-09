import { RULE_DETECTORS } from './ruleDetectors';
import { shannonEntropy } from './entropy';
import type { DetectionResult } from './types';

export interface EmbeddedMatch extends DetectionResult {
  index: number;
  length: number;
}

const isTokenChar = (ch: string): boolean => ch !== '' && /[A-Za-z0-9]/.test(ch);

interface Candidate extends EmbeddedMatch {
  rank: number;
}

function better(next: Candidate, best: Candidate | null): boolean {
  if (best === null) {
    return true;
  }
  return next.index < best.index || (next.index === best.index && next.rank < best.rank);
}

/**
 * Every value-shape match in `text`, unordered and possibly overlapping. Shared
 * by `detectEmbedded` and `findAllEmbedded` so the matching rules — group
 * selection, entropy guard, token-boundary guard — live in one place.
 */
function* iterateEmbeddedMatches(text: string): Generator<Candidate> {
  const lower = text.toLowerCase();

  for (let i = 0; i < RULE_DETECTORS.length; i++) {
    const rule = RULE_DETECTORS[i]!;
    if (rule.keywords.length > 0 && !rule.keywords.some((k) => lower.includes(k))) {
      continue;
    }
    const { regex } = rule;
    regex.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const groupIndex = m.indices && m.indices[1] ? 1 : 0;
      const span = m.indices?.[groupIndex];
      const secret = m[groupIndex] ?? m[0];
      if (!span || secret.length === 0) {
        if (m.index === regex.lastIndex) {
          regex.lastIndex += 1;
        }
        continue;
      }
      const [start, end] = span;
      if (rule.entropy != null && shannonEntropy(secret) < rule.entropy) {
        continue;
      }
      if (isTokenChar(text[start - 1] ?? '') || isTokenChar(text[end] ?? '')) {
        continue;
      }
      yield {
        type: rule.type,
        label: rule.label,
        confidence: rule.confidence,
        secret,
        index: start,
        length: end - start,
        rank: i,
      };
    }
  }
}

/**
 * The leftmost secret in `text`, ties broken by detector priority (custom rules
 * first, then the gitleaks).
 */
export function detectEmbedded(text: string): EmbeddedMatch | null {
  let best: Candidate | null = null;
  for (const candidate of iterateEmbeddedMatches(text)) {
    if (better(candidate, best)) {
      best = candidate;
    }
  }

  if (best === null) {
    return null;
  }
  const { rank: _rank, ...match } = best;
  return match;
}

/**
 * Every secret in `text`, non-overlapping and in source order.
 */
export function findAllEmbedded(text: string): EmbeddedMatch[] {
  const candidates = [...iterateEmbeddedMatches(text)].sort((a, b) => a.index - b.index || a.rank - b.rank);

  const accepted: EmbeddedMatch[] = [];
  let lastEnd = -1;
  for (const candidate of candidates) {
    if (candidate.index < lastEnd) {
      continue;
    }
    const { rank: _rank, ...match } = candidate;
    accepted.push(match);
    lastEnd = candidate.index + candidate.length;
  }
  return accepted;
}
