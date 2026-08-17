// cspell:ignore AKIAIOSFODNN xoxb ncde plainvalue letmein
import { describe, it, expect } from '@jest/globals';

import { scanCode, offsetToPosition, shannonEntropy } from './scanCode';

describe('scanCode', () => {
  it('returns nothing for an empty or secret-free script', () => {
    expect(scanCode('')).toEqual([]);
    expect(scanCode(`export default function () { http.get('https://test.k6.io') }`)).toEqual([]);
  });

  it('detects a JWT embedded after a Bearer prefix', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const script = `const headers = { Authorization: 'Bearer ${jwt}' }`;

    const [finding, ...rest] = scanCode(script);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('jwt');
    expect(finding?.secret).toBe(jwt);
    expect(finding?.confidence).toBe('high');
    // Embedded in a plain string (after `Bearer `), so flagged but not rewritten.
    expect(finding?.rewrite).toBe('none');
  });

  it('detects an AWS access key id', () => {
    const script = `const key = "AKIAIOSFODNN7EXAMPLE"`;
    const [finding] = scanCode(script);

    expect(finding?.type).toBe('aws-access-key-id');
    expect(finding?.secret).toBe('AKIAIOSFODNN7EXAMPLE');
  });

  it('detects GitHub, Slack, Google and Stripe tokens', () => {
    const types = scanCode(
      [
        `const gh = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'`,
        `const slack = 'xoxb-1234567890-abcdefghijkl'`,
        `const goog = 'AIzaSyA1234567890abcdefghijklmnopqrstuv'`,
        `const stripe = 'sk_live_1234567890abcdefABCD'`,
      ].join('\n')
    ).map((finding) => finding.type);

    expect(types).toEqual(['github-token', 'slack-token', 'google-api-key', 'stripe-key']);
  });

  it('flags a high-entropy token but ignores low-entropy / placeholder strings', () => {
    const script = [
      `const real = 'Zx9Kq2Lm7Pw4Rt6Yv8Bn1Dc3Fh5Jg0'`,
      `const placeholder = 'YOUR_API_TOKEN_HERE'`,
      `const word = 'this-is-a-normal-config-value'`,
    ].join('\n');

    const findings = scanCode(script);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('high-entropy');
  });

  it('does not flag URLs as high-entropy secrets', () => {
    const script = `const url = 'https://abcdefghijklmnopqrstuvwxyz0123456789.example.com'`;
    expect(scanCode(script)).toEqual([]);
  });

  it('reports the correct 1-based line of each finding', () => {
    const script = [`import http from 'k6/http'`, ``, `const token = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'`].join(
      '\n'
    );

    const [finding] = scanCode(script);
    expect(finding?.line).toBe(3);
  });

  it('flags an unremarkable value assigned to a sensitive variable name', () => {
    const [finding, ...rest] = scanCode(`const pass = 'function'`);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('named');
    expect(finding?.confidence).toBe('low');
    expect(finding?.secret).toBe('function');
  });

  it('matches sensitive names across casing and object properties', () => {
    const types = scanCode(
      [
        `const apiKey = 'abcd1234'`,
        `let access_token = 'plainvalue'`,
        `const config = { password: 'letmein1' }`,
        `obj.authSecret = 'qwerty12'`,
      ].join('\n')
    ).map((finding) => finding.type);

    expect(types).toEqual(['named', 'named', 'named', 'named']);
  });

  it('does not flag non-sensitive names or word-substring lookalikes', () => {
    const script = [
      `const author = 'Shakespeare'`,
      `const keyboard = 'mechanical'`,
      `const monkey = 'business1'`,
      `const message = 'hello world'`,
    ].join('\n');

    expect(scanCode(script)).toEqual([]);
  });

  it('does not flag sensitive names assigned URLs, sentences or short values', () => {
    const script = [
      `const authUrl = 'https://auth.example.com/login'`,
      `const passHint = 'remember your first pet'`,
      `const key = 'abc'`,
    ].join('\n');

    expect(scanCode(script)).toEqual([]);
  });

  it('prefers the value-shape detector over the name fallback', () => {
    // `key` is a sensitive name, but the AWS detector is higher signal.
    const [finding] = scanCode(`const key = "AKIAIOSFODNN7EXAMPLE"`);

    expect(finding?.type).toBe('aws-access-key-id');
  });

  it('only emits one finding per literal (highest priority detector wins)', () => {
    // A JWT is also high-entropy, but should be reported once, as a JWT.
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZSJ9.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const findings = scanCode(`const t = '${jwt}'`);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('jwt');
  });

  it('is comment-aware: an apostrophe in a comment does not swallow a real literal', () => {
    // The `'` in "don't" must not open a phantom string that eats the token.
    const script = ["// don't hardcode tokens", `const token = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'`].join('\n');

    const findings = scanCode(script);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('github-token');
    expect(findings[0]?.secret).toBe('ghp_1234567890abcdefghijklmnopqrstuvwxyz');
  });

  it('ignores secrets that live inside block comments', () => {
    const script = `/* const key = "AKIAIOSFODNN7EXAMPLE" */\nconst safe = 'plain-config'`;

    expect(scanCode(script)).toEqual([]);
  });

  it('does not treat "//" inside a string literal as a comment', () => {
    const script = [
      `const url = 'https://example.com/path'`,
      `const gh = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'`,
    ].join('\n');

    const findings = scanCode(script);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('github-token');
  });

  it('skips template literals with interpolation and still scans past them', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJtZSJ9.AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const script = ['const greeting = `hello ${name} at ${host}`', `const t = '${jwt}'`].join('\n');

    const findings = scanCode(script);

    expect(findings).toHaveLength(1);
    expect(findings[0]?.type).toBe('jwt');
  });

  it('reports the exact source range for a secret preceded by an escape sequence', () => {
    const jwt = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
    const script = `const h = 'A\\tB Bearer ${jwt}'`;

    const [finding] = scanCode(script);

    expect(finding?.secret).toBe(jwt);
    expect(script.slice(finding!.range.start, finding!.range.end)).toBe(jwt);
  });

  it('resolves the assigned name across a comment between "=" and the value', () => {
    const [finding] = scanCode(`const password = /* set me later */ 'function'`);

    expect(finding?.type).toBe('named');
  });

  it('resolves the name of a computed member assignment target', () => {
    const [finding] = scanCode(`obj['token'] = 'qwerty12'`);

    expect(finding?.type).toBe('named');
  });

  it('still detects a secret when the file uses a TS construct acorn-typescript rejects', () => {
    // `satisfies` (and angle-bracket assertions) make the strict TS parse throw.
    // The loose fallback must keep scanning so the token elsewhere isn't missed.
    const gh = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz';
    const script = [`const cfg = { a: 1 } satisfies Record<string, number>`, `const token = '${gh}'`].join('\n');

    const [finding, ...rest] = scanCode(script);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('github-token');
    expect(finding?.secret).toBe(gh);
    // Offsets from the loose parse still point at the literal in the original source.
    expect(script.slice(finding!.range.start, finding!.range.end)).toContain(gh);
  });

  it('does not throw and finds nothing on unrecoverable input', () => {
    expect(scanCode('const {{{')).toEqual([]);
  });

  it('detects a Grafana service-account token and rewrites a whole-value hit as a literal', () => {
    const token = 'glsa_QrneKTYtSZt3qDXqDrzbDLMTmAKlpQpM_55d72f20';
    const [finding, ...rest] = scanCode(`const t = '${token}'`);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('grafana-token');
    expect(finding?.secret).toBe(token);
    expect(finding?.rewrite).toBe('literal');
  });

  it('separates the secret range from the enclosing literal range', () => {
    const token = 'glsa_QrneKTYtSZt3qDXqDrzbDLMTmAKlpQpM_55d72f20';
    const script = `const t = '${token}'`;
    const [finding] = scanCode(script);

    // `range` covers the value; `literal` adds the quotes around it.
    expect(script.slice(finding!.range.start, finding!.range.end)).toBe(token);
    expect(script.slice(finding!.literal!.start, finding!.literal!.end)).toBe(`'${token}'`);
  });

  it('detects a secret embedded in a plain string and flags it as non-rewritable', () => {
    const token = 'glsa_QrneKTYtSZt3qDXqDrzbDLMTmAKlpQpM_55d72f20';
    const script = `const u = 'https://x.test/payments/2a1546?token=${token}'`;

    const [finding, ...rest] = scanCode(script);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('grafana-token');
    expect(finding?.secret).toBe(token);
    expect(finding?.rewrite).toBe('none');
    // The reported range covers exactly the embedded token, not the whole URL.
    expect(script.slice(finding!.range.start, finding!.range.end)).toBe(token);
  });

  it('detects a secret embedded in a template literal and marks it template-interpolation', () => {
    const token = 'glsa_QrneKTYtSZt3qDXqDrzbDLMTmAKlpQpM_55d72f20';
    // const u = `${base}/payments/2a1546?token=<token>`
    const script = 'const u = `${base}/payments/2a1546?token=' + token + '`';

    const [finding, ...rest] = scanCode(script);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('grafana-token');
    expect(finding?.secret).toBe(token);
    expect(finding?.rewrite).toBe('template-interpolation');
    expect(script.slice(finding!.range.start, finding!.range.end)).toBe(token);
  });

  it('detects a long-tail provider token via the gitleaks supplement', () => {
    const token = 'npm_0123456789abcdefghijklmnopqrstuvwxyz';
    const [finding, ...rest] = scanCode(`const t = '${token}'`);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('npm-access-token');
    expect(finding?.confidence).toBe('medium');
    expect(finding?.secret).toBe(token);
  });

  it('does not flag ordinary path/query fragments as embedded secrets', () => {
    const script = 'const u = `${base}/api/v2/reports/2a1546b7c8?page=3&sort=created`';
    expect(scanCode(script)).toEqual([]);
  });

  it('detects a base64 (non-url) JWT embedded in a URL despite + and / chars', () => {
    // Standard-base64 JWT: contains `+` and `/`, which a token-splitting
    // character class would break on.
    const token =
      'eyJIRZAxfeqt4rCT91ddL9i.eyJubkvlfCnzYMkFYMB7OR6vJ+ZKDpYrQMKgJuOrQaW.YFUZf1WdtVjGvUunV+T3fG/IswT7ITIebC1arYeg26q';
    const script = 'const res = http.del(`${CONFIG.baseUrl}/products/63e95e?token=' + token + '`)';

    const [finding, ...rest] = scanCode(script);

    expect(rest).toHaveLength(0);
    expect(finding?.type).toBe('jwt');
    expect(finding?.secret).toBe(token);
    expect(finding?.rewrite).toBe('template-interpolation');
    expect(script.slice(finding!.range.start, finding!.range.end)).toBe(token);
  });
});

describe('offsetToPosition', () => {
  it('maps offsets to 1-based line and column', () => {
    const text = 'ab\ncde\nf';
    expect(offsetToPosition(text, 0)).toEqual({ line: 1, column: 1 });
    expect(offsetToPosition(text, 3)).toEqual({ line: 2, column: 1 });
    expect(offsetToPosition(text, 5)).toEqual({ line: 2, column: 3 });
    expect(offsetToPosition(text, 7)).toEqual({ line: 3, column: 1 });
  });
});

describe('shannonEntropy', () => {
  it('is zero for a single repeated character and high for random input', () => {
    expect(shannonEntropy('aaaaaaaa')).toBe(0);
    expect(shannonEntropy('Zx9Kq2Lm7Pw4Rt6')).toBeGreaterThan(3.5);
  });
});
