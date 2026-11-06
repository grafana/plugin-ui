// cspell:ignore AKIAIOSFODNN
import { describe, it, expect } from '@jest/globals';

import { scanCode } from './scanCode';
import { scanText } from './scanText';
import { applySecretReference, buildSecretReference, k6SecretRewriter } from './k6Rewriter';
import type { SecretRewriter } from './rewrite';

function applyFirst(script: string, name: string) {
  const [finding] = scanCode(script);
  if (!finding) {
    throw new Error('expected a finding');
  }
  return applySecretReference(script, finding, name);
}

describe('buildSecretReference', () => {
  it('emits an async secrets.get call, honoring a custom binding', () => {
    expect(buildSecretReference('my-secret')).toBe("await secrets.get('my-secret')");
    expect(buildSecretReference('my-secret', 'mySecrets')).toBe("await mySecrets.get('my-secret')");
  });
});

describe('applySecretReference', () => {
  it('replaces a bare secret literal and adds the import', () => {
    const script = `const key = "AKIAIOSFODNN7EXAMPLE"`;
    const result = applyFirst(script, 'aws-key');

    expect(result.addedImport).toBe(true);
    expect(result.needsAsync).toBe(true);
    expect(result.text).toBe(
      [`import secrets from 'k6/secrets'`, `const key = await secrets.get('aws-key')`].join('\n')
    );
  });

  it('reuses an existing k6/secrets import and its binding name', () => {
    const script = [
      `import mySecrets from 'k6/secrets'`,
      `const key = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'`,
    ].join('\n');

    const result = applyFirst(script, 'gh-token');

    expect(result.addedImport).toBe(false);
    // No duplicate import line.
    expect(result.text.match(/k6\/secrets/g)).toHaveLength(1);
    expect(result.text).toContain(`await mySecrets.get('gh-token')`);
  });

  it('leaves the rest of the script untouched', () => {
    const script = [
      `import http from 'k6/http'`,
      `const key = "AKIAIOSFODNN7EXAMPLE"`,
      `export default function () { http.get('https://test.k6.io') }`,
    ].join('\n');

    const result = applyFirst(script, 'aws-key');

    expect(result.text).toContain(`import http from 'k6/http'`);
    expect(result.text).toContain(`export default function () { http.get('https://test.k6.io') }`);
    expect(result.text).not.toContain('AKIAIOSFODNN7EXAMPLE');
  });

  it('no-ops when the finding no longer matches the script (stale offsets)', () => {
    const script = `const key = "AKIAIOSFODNN7EXAMPLE"`;
    const [finding] = scanCode(script);
    if (!finding) {
      throw new Error('expected a finding');
    }

    const moved = `// an unrelated line inserted above\n${script}`;
    const result = applySecretReference(moved, finding, 'aws-key');

    expect(result.applied).toBe(false);
    expect(result.text).toBe(moved);
    expect(result.addedImport).toBe(false);
  });

  it('does not rewrite a secret embedded in a plain string, leaving the script untouched', () => {
    const token = 'glsa_QrneKTYtSZt3qDXqDrzbDLMTmAKlpQpM_55d72f20';
    const script = `const u = 'https://x.test/p?token=${token}'`;

    const [finding] = scanCode(script);
    expect(finding?.rewrite).toBe('none');

    const result = applySecretReference(script, finding!, 'my-secret');

    expect(result.applied).toBe(false);
    expect(result.text).toBe(script);
    expect(result.addedImport).toBe(false);
  });

  it('splices ${…} for a secret embedded in a template literal', () => {
    const token = 'glsa_QrneKTYtSZt3qDXqDrzbDLMTmAKlpQpM_55d72f20';
    const script = 'const u = `${base}/users/e1db52?token=' + token + '`';

    const [finding] = scanCode(script);
    expect(finding?.rewrite).toBe('template-interpolation');

    const result = applySecretReference(script, finding!, 'a');

    expect(result.applied).toBe(true);
    expect(result.needsAsync).toBe(true);
    expect(result.text).toContain("?token=${await secrets.get('a')}`");
    // The existing ${base} interpolation is untouched, and no hardcoded token remains.
    expect(result.text).toContain('`${base}/users/e1db52?token=');
    expect(result.text).not.toContain(token);
  });

  it('no-ops on a text-scan finding, which carries no rewrite mode', () => {
    const text = 'Log in with API key AKIAIOSFODNN7EXAMPLE then open the dashboard';
    const [finding] = scanText(text);

    expect(finding?.rewrite).toBeUndefined();

    const result = applySecretReference(text, finding!, 'aws-key');

    expect(result.applied).toBe(false);
    expect(result.text).toBe(text);
  });
});

describe('k6SecretRewriter', () => {
  it('exposes the k6 apply/reference pair behind the SecretRewriter interface', () => {
    const rewriter: SecretRewriter = k6SecretRewriter;
    const script = `const key = "AKIAIOSFODNN7EXAMPLE"`;

    expect(rewriter.reference('my-secret')).toBe("await secrets.get('my-secret')");
    expect(rewriter.apply(script, scanCode(script)[0]!, 'aws-key').applied).toBe(true);
  });
});
