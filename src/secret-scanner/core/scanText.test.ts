// cspell:ignore AKIAIOSFODNN ghp
import { describe, it, expect } from '@jest/globals';

import { createTextScanner, scanText } from './scanText';

describe('scanText', () => {
  it('returns nothing for empty or secret-free prose', () => {
    expect(scanText('')).toEqual([]);
    expect(scanText('Click "Sign in", fill the email field, then verify the dashboard loads')).toEqual([]);
  });

  it('flags a secret typed inline in prose, where scanCode (code-first) would not', () => {
    const findings = scanText('Log in with API key AKIAIOSFODNN7EXAMPLE then open the dashboard');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('aws-access-key-id');
    expect(findings[0]?.secret).toBe('AKIAIOSFODNN7EXAMPLE');
  });

  it('detects a JWT with no surrounding quotes', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const findings = scanText(`Send the request with bearer ${jwt} in the header`);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('jwt');
    expect(findings[0]?.secret).toBe(jwt);
  });

  it('returns every secret in source order with non-overlapping positions', () => {
    const text = 'Use ghp_1234567890abcdefghijklmnopqrstuvwxyz and sk_live_1234567890abcdefABCD to authenticate';
    const findings = scanText(text);

    expect(findings.map((f) => f.type)).toEqual(['github-token', 'stripe-key']);
    // Positions are ordered and each maps back to the secret at that offset.
    expect(findings[0]!.range.start).toBeLessThan(findings[1]!.range.start);
    for (const finding of findings) {
      expect(text.slice(finding.range.start, finding.range.end)).toBe(finding.secret);
    }
  });

  it('flags an opaque high-entropy password that matches no vendor rule', () => {
    const password = 'd41d8cd98f00b204e9800998ecf8427eM3vXyZ9q';
    const findings = scanText(`sign in with the username "test" and password "${password}"`);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('high-entropy');
    expect(findings[0]?.secret).toBe(password);
  });

  it('does not double-flag a rule match as a high-entropy blob', () => {
    const findings = scanText('token ghp_1234567890abcdefghijklmnopqrstuvwxyz here');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('github-token');
  });

  it('reports a JWT in a URL as one finding, not its dot-separated segments', () => {
    const jwt =
      'eyJFlQU4b33pj33eAYLG3XD.eyJa+iQ67GB6+MB6Lb27j0nqkWAWHEWhzJcKBrI6pnl.hglqB5pPbPIBVaF/6jf+4TANveqdOZDCW9A91jYTwMR';
    const findings = scanText(`Go to the /orders/8951c9?token=${jwt}`);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('jwt');
    expect(findings[0]?.secret).toBe(jwt);
  });

  it('ignores short or low-entropy words that are not secrets', () => {
    expect(scanText('sign in with the username "test" and click continue')).toEqual([]);
  });

  it('resolves 1-based line and column across newlines', () => {
    const findings = scanText('First step\nUse key AKIAIOSFODNN7EXAMPLE here');

    expect(findings).toHaveLength(1);
    expect(findings[0]?.line).toBe(2);
    expect(findings[0]?.column).toBe(9);
  });

  it('carries no literal or rewrite: prose has neither', () => {
    const [finding] = scanText('Use key AKIAIOSFODNN7EXAMPLE here');

    expect(finding?.literal).toBeUndefined();
    expect(finding?.rewrite).toBeUndefined();
  });

  it('gives each createTextScanner its own memo', () => {
    const first = createTextScanner();
    const second = createTextScanner();
    const a = 'Use key AKIAIOSFODNN7EXAMPLE here';
    const b = 'Token ghp_1234567890abcdefghijklmnopqrstuvwxyz here';

    // Alternating inputs across two scanners must not evict each other; each
    // still returns its own cached array.
    expect(first(a)).toBe(first(a));
    expect(second(b)).toBe(second(b));
    expect(first(a)[0]?.type).toBe('aws-access-key-id');
    expect(second(b)[0]?.type).toBe('github-token');
  });
});
