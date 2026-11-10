// Value-shape detectors built from data: tuned patterns in custom.toml plus the
// vendored gitleaks file. Custom rules are authoritative — any gitleaks rule
// whose keywords overlap a custom rule's is skipped, so the custom pattern wins
// over gitleaks' file-oriented version of the same secret.
//
// The TOML is compiled ahead of time by `yarn gen:secret-rules`, so no TOML
// parser is bundled. Edit the `.toml` files, then re-run the generator.
import { CUSTOM_RULES, GITLEAKS_RULES, type SecretRule } from '../../rules/rules.generated';
import type { SecretConfidence } from './types';

export interface RuleDetector {
  type: string;
  label: string;
  confidence: SecretConfidence;
  regex: RegExp;
  entropy?: number;
  keywords: string[];
}

/** Rewrites a gitleaks (Go/RE2) pattern into an equivalent the JS engine accepts. */
function toJsRegex(source: string): RegExp | null {
  let body = source;
  let flags = 'gd';
  if (/\(\?i\)/.test(body)) {
    body = body.replace(/\(\?i\)/g, '');
    flags += 'i';
  }
  body = body.replace(/\(\?P</g, '(?<');
  try {
    return new RegExp(body, flags);
  } catch {
    return null;
  }
}

function normalizeLabelFromId(id: string): string {
  return id.replace(/-/g, ' ').toUpperCase();
}

function compile(rule: SecretRule, defaultConfidence: SecretConfidence): RuleDetector | null {
  if (typeof rule.regex !== 'string') {
    return null;
  }
  const regex = toJsRegex(rule.regex);
  if (regex === null) {
    return null;
  }
  return {
    type: rule.id,
    label: normalizeLabelFromId(rule.id),
    confidence: rule.confidence ?? defaultConfidence,
    regex,
    entropy: rule.entropy,
    keywords: (rule.keywords ?? []).map((k) => k.toLowerCase()),
  };
}

function build(): RuleDetector[] {
  // custom detectors first — they rank ahead of the gitleaks file.
  const custom = CUSTOM_RULES.map((r) => compile(r, 'high')).filter((d): d is RuleDetector => d !== null);

  const covered = custom.flatMap((d) => d.keywords);
  const isCovered = (keywords: string[]) =>
    keywords.some((k) => covered.some((p) => k.startsWith(p) || p.startsWith(k)));

  const supplemental: RuleDetector[] = [];
  for (const rule of GITLEAKS_RULES) {
    const keywords = (rule.keywords ?? []).map((k) => k.toLowerCase());
    if (isCovered(keywords)) {
      continue;
    }
    const detector = compile(rule, 'medium');
    if (detector !== null) {
      supplemental.push(detector);
    }
  }

  return [...custom, ...supplemental];
}

export const RULE_DETECTORS: RuleDetector[] = build();
