/**
 * Code-first scanner: flags likely hardcoded secrets in a script.
 *
 * String-literal aware (AST-based) rather than raw-text, so reported ranges line
 * up with what the user sees and a rewrite can edit the original text.
 *
 * For plain-text outside a literal, use `scanText`.
 *
 * Orchestration only; the detectors live in `./detection`.
 */

import { iterateStringLiterals } from './detection/literals';
import { isPlaceholder } from './detection/placeholders';
import { createPositionResolver } from './detection/position';
import { detectEmbedded } from './detection/embedded';
import { detectHighEntropy } from './detection/highEntropy';
import { detectFromName } from './detection/nameDetector';
import type { SecretFinding } from './detection/types';
import { memoizeLatest } from './memoizeLatest';

function scan(script: string): SecretFinding[] {
  const findings: SecretFinding[] = [];
  const positionAt = createPositionResolver(script);

  for (const {
    body,
    literalStart,
    literalEnd,
    contentStart,
    contentEnd,
    kind,
    name,
    embeddedOnly,
  } of iterateStringLiterals(script)) {
    const literal = { start: literalStart, end: literalEnd };

    const embedded = detectEmbedded(script.slice(contentStart, contentEnd));
    if (embedded) {
      // A match covering the whole content means the literal *is* the secret
      const spansWholeLiteral = !embeddedOnly && embedded.index === 0 && embedded.length === contentEnd - contentStart;
      const secretStart = contentStart + embedded.index;
      const range = { start: secretStart, end: secretStart + embedded.length };
      const { line, column } = positionAt(range.start);

      findings.push({
        id: `${range.start}-${embedded.type}`,
        type: embedded.type,
        label: embedded.label,
        confidence: embedded.confidence,
        secret: embedded.secret,
        range,
        line,
        column,
        literal,
        rewrite: spansWholeLiteral ? 'literal' : kind === 'template' ? 'template-interpolation' : 'none',
      });
      continue;
    }

    if (!embeddedOnly && body.length > 0 && !isPlaceholder(body)) {
      const detected = detectHighEntropy(body) ?? detectFromName(body, name);
      if (detected) {
        const range = { start: contentStart, end: contentEnd };
        const { line, column } = positionAt(range.start);
        findings.push({
          id: `${range.start}-${detected.type}`,
          ...detected,
          range,
          line,
          column,
          literal,
          rewrite: 'literal',
        });
      }
    }
  }

  return findings;
}

/**
 * A code scanner with its own memo. Prefer this to the shared {@link scanCode}
 * when more than one surface scans independently — see `memoizeLatest`.
 */
export function createCodeScanner(): (script: string) => SecretFinding[] {
  return memoizeLatest(scan);
}

/** Shared code scanner, for a host with a single scanning surface. */
export const scanCode = createCodeScanner();

export { offsetToPosition } from './detection/position';
export { shannonEntropy } from './detection/entropy';
export type { SecretFinding, SecretConfidence, SecretRange, SecretRewrite } from './detection/types';
