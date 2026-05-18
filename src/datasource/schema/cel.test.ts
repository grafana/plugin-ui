import {
  evaluateCelExpression,
  evaluateCelDirect,
  buildCelContext,
  extractFieldRefs,
  isValidCelExpression,
  clearExpressionCache,
} from './cel';

beforeEach(() => {
  clearExpressionCache();
});

// ============================================================
// evaluateCelExpression — basic operators
// ============================================================

describe('evaluateCelExpression', () => {
  describe('equality (==)', () => {
    it('string equality', () => {
      expect(evaluateCelExpression("method == 'oauth2'", { method: 'oauth2' })).toBe(true);
      expect(evaluateCelExpression("method == 'oauth2'", { method: 'basic' })).toBe(false);
    });

    it('boolean equality', () => {
      expect(evaluateCelExpression('enabled == true', { enabled: true })).toBe(true);
      expect(evaluateCelExpression('enabled == true', { enabled: false })).toBe(false);
    });

    it('numeric equality', () => {
      expect(evaluateCelExpression('count == 5', { count: 5 })).toBe(true);
    });
  });

  describe('inequality (!=)', () => {
    it('string inequality', () => {
      expect(evaluateCelExpression("method != 'none'", { method: 'oauth2' })).toBe(true);
      expect(evaluateCelExpression("method != 'none'", { method: 'none' })).toBe(false);
    });

    it('boolean inequality', () => {
      expect(evaluateCelExpression('enabled != false', { enabled: true })).toBe(true);
    });
  });

  // ============================================================
  // Logical operators — AND, OR
  // ============================================================

  describe('logical AND (&&)', () => {
    it('both true', () => {
      expect(evaluateCelExpression("a == 'x' && b == 'y'", { a: 'x', b: 'y' })).toBe(true);
    });

    it('first false', () => {
      expect(evaluateCelExpression("a == 'x' && b == 'y'", { a: 'z', b: 'y' })).toBe(false);
    });

    it('second false', () => {
      expect(evaluateCelExpression("a == 'x' && b == 'y'", { a: 'x', b: 'z' })).toBe(false);
    });

    it('both false', () => {
      expect(evaluateCelExpression("a == 'x' && b == 'y'", { a: 'z', b: 'z' })).toBe(false);
    });
  });

  describe('logical OR (||)', () => {
    it('both true', () => {
      expect(evaluateCelExpression("a == 'x' || b == 'y'", { a: 'x', b: 'y' })).toBe(true);
    });

    it('first true only', () => {
      expect(evaluateCelExpression("a == 'x' || b == 'y'", { a: 'x', b: 'z' })).toBe(true);
    });

    it('second true only', () => {
      expect(evaluateCelExpression("a == 'x' || b == 'y'", { a: 'z', b: 'y' })).toBe(true);
    });

    it('both false', () => {
      expect(evaluateCelExpression("a == 'x' || b == 'y'", { a: 'z', b: 'z' })).toBe(false);
    });
  });

  // ============================================================
  // Parenthesized expressions and precedence
  // ============================================================

  describe('parentheses and precedence', () => {
    it('(A || B) && C', () => {
      const expr = "(method == 'basic' || method == 'digest') && enabled == true";
      expect(evaluateCelExpression(expr, { method: 'basic', enabled: true })).toBe(true);
      expect(evaluateCelExpression(expr, { method: 'digest', enabled: true })).toBe(true);
      expect(evaluateCelExpression(expr, { method: 'basic', enabled: false })).toBe(false);
      expect(evaluateCelExpression(expr, { method: 'none', enabled: true })).toBe(false);
    });

    it('A && (B || C)', () => {
      const expr = "enabled == true && (method == 'oauth2' || method == 'jwt')";
      expect(evaluateCelExpression(expr, { enabled: true, method: 'oauth2' })).toBe(true);
      expect(evaluateCelExpression(expr, { enabled: true, method: 'jwt' })).toBe(true);
      expect(evaluateCelExpression(expr, { enabled: false, method: 'oauth2' })).toBe(false);
    });

    it('&& binds tighter than || (standard precedence)', () => {
      // A || B && C  ≡  A || (B && C)
      const expr = "a == 'x' || b == 'y' && c == 'z'";
      // a=x → true regardless of b,c
      expect(evaluateCelExpression(expr, { a: 'x', b: 'n', c: 'n' })).toBe(true);
      // a!=x, b=y, c=z → true (B && C is true)
      expect(evaluateCelExpression(expr, { a: 'n', b: 'y', c: 'z' })).toBe(true);
      // a!=x, b=y, c!=z → false (B && C is false, A is false)
      expect(evaluateCelExpression(expr, { a: 'n', b: 'y', c: 'n' })).toBe(false);
    });
  });

  // ============================================================
  // Negation
  // ============================================================

  describe('negation (!)', () => {
    it('!true is false', () => {
      expect(evaluateCelExpression('!enabled', { enabled: true })).toBe(false);
    });

    it('!false is true', () => {
      expect(evaluateCelExpression('!enabled', { enabled: false })).toBe(true);
    });

    it('!(expr)', () => {
      expect(evaluateCelExpression("!(method == 'none')", { method: 'oauth2' })).toBe(true);
      expect(evaluateCelExpression("!(method == 'none')", { method: 'none' })).toBe(false);
    });
  });

  // ============================================================
  // Dotted field references (nested context)
  // ============================================================

  describe('dotted field references (nested objects)', () => {
    it('target.key access', () => {
      expect(evaluateCelExpression("jsonData.auth_method == 'oauth2'", { jsonData: { auth_method: 'oauth2' } })).toBe(
        true
      );
    });

    it('target.section.key access (3 levels)', () => {
      const ctx = { jsonData: { oauth2: { oauth2_type: 'jwt' } } };
      expect(evaluateCelExpression("jsonData.oauth2.oauth2_type == 'jwt'", ctx)).toBe(true);
      expect(evaluateCelExpression("jsonData.oauth2.oauth2_type == 'client_credentials'", ctx)).toBe(false);
    });

    it('compound with nested fields', () => {
      const ctx = { jsonData: { auth_method: 'oauth2', oauth2: { oauth2_type: 'jwt' } } };
      expect(
        evaluateCelExpression("jsonData.auth_method == 'oauth2' && jsonData.oauth2.oauth2_type == 'jwt'", ctx)
      ).toBe(true);
      expect(
        evaluateCelExpression(
          "jsonData.auth_method == 'oauth2' && jsonData.oauth2.oauth2_type == 'client_credentials'",
          ctx
        )
      ).toBe(false);
    });
  });

  // ============================================================
  // Real-world Infinity schema scenarios
  // ============================================================

  describe('Infinity schema scenarios', () => {
    it('basic auth fields visible when method is basicAuth', () => {
      expect(
        evaluateCelExpression("jsonData.auth_method == 'basicAuth'", { jsonData: { auth_method: 'basicAuth' } })
      ).toBe(true);
      expect(evaluateCelExpression("jsonData.auth_method == 'basicAuth'", { jsonData: { auth_method: 'none' } })).toBe(
        false
      );
    });

    it('oauth2 client_credentials fields', () => {
      const ctx = { jsonData: { auth_method: 'oauth2', oauth2: { oauth2_type: 'client_credentials' } } };
      expect(evaluateCelExpression("jsonData.oauth2.oauth2_type == 'client_credentials'", ctx)).toBe(true);
    });

    it('oauth2 JWT fields — compound condition', () => {
      const expr = "jsonData.auth_method == 'oauth2' && jsonData.oauth2.oauth2_type == 'jwt'";
      expect(
        evaluateCelExpression(expr, {
          jsonData: { auth_method: 'oauth2', oauth2: { oauth2_type: 'jwt' } },
        })
      ).toBe(true);
      expect(
        evaluateCelExpression(expr, {
          jsonData: { auth_method: 'oauth2', oauth2: { oauth2_type: 'client_credentials' } },
        })
      ).toBe(false);
      expect(
        evaluateCelExpression(expr, {
          jsonData: { auth_method: 'basic' },
        })
      ).toBe(false);
    });

    it('allowed hosts visible when auth is not none', () => {
      expect(evaluateCelExpression("jsonData.auth_method != 'none'", { jsonData: { auth_method: 'oauth2' } })).toBe(
        true
      );
      expect(evaluateCelExpression("jsonData.auth_method != 'none'", { jsonData: { auth_method: 'none' } })).toBe(
        false
      );
    });

    it('TLS cert visible when tlsAuth is true', () => {
      expect(evaluateCelExpression('jsonData.tlsAuth == true', { jsonData: { tlsAuth: true } })).toBe(true);
      expect(evaluateCelExpression('jsonData.tlsAuth == true', { jsonData: { tlsAuth: false } })).toBe(false);
    });

    it('proxy URL visible when proxy_type is url', () => {
      expect(evaluateCelExpression("jsonData.proxy_type == 'url'", { jsonData: { proxy_type: 'url' } })).toBe(true);
      expect(evaluateCelExpression("jsonData.proxy_type == 'url'", { jsonData: { proxy_type: 'env' } })).toBe(false);
    });

    it('hypothetical OR: field visible for multiple auth methods', () => {
      const expr = "jsonData.auth_method == 'oauth2' || jsonData.auth_method == 'bearerToken'";
      expect(evaluateCelExpression(expr, { jsonData: { auth_method: 'oauth2' } })).toBe(true);
      expect(evaluateCelExpression(expr, { jsonData: { auth_method: 'bearerToken' } })).toBe(true);
      expect(evaluateCelExpression(expr, { jsonData: { auth_method: 'basic' } })).toBe(false);
    });
  });

  // ============================================================
  // Edge cases
  // ============================================================

  describe('edge cases', () => {
    it('empty expression returns default (false)', () => {
      expect(evaluateCelExpression('', {})).toBe(false);
    });

    it('whitespace-only expression returns default (false)', () => {
      expect(evaluateCelExpression('   ', {})).toBe(false);
    });

    it('invalid expression returns default (false)', () => {
      expect(evaluateCelExpression('!!!invalid???', {})).toBe(false);
    });

    it('custom default value', () => {
      expect(evaluateCelExpression('', {}, true)).toBe(true);
    });

    it('missing variable in context returns false', () => {
      expect(evaluateCelExpression("missing == 'x'", {})).toBe(false);
    });

    it('caches parsed expressions', () => {
      const ctx = { a: 'x' };
      evaluateCelExpression("a == 'x'", ctx);
      evaluateCelExpression("a == 'x'", ctx);
      // No error means caching works (no way to directly observe cache without internals)
      expect(evaluateCelExpression("a == 'x'", ctx)).toBe(true);
    });
  });
});

// ============================================================
// buildCelContext
// ============================================================

describe('buildCelContext', () => {
  it('passes through flat keys', () => {
    const ctx = buildCelContext({ method: 'oauth2', enabled: true });
    expect(ctx).toEqual({ method: 'oauth2', enabled: true });
  });

  it('builds nested objects from dotted keys', () => {
    const ctx = buildCelContext({
      auth_method: 'oauth2',
      'oauth2.oauth2_type': 'jwt',
      'oauth2.email': 'test@example.com',
    });
    expect(ctx).toEqual({
      auth_method: 'oauth2',
      oauth2: { oauth2_type: 'jwt', email: 'test@example.com' },
    });
  });

  it('handles deeply nested keys', () => {
    const ctx = buildCelContext({ 'a.b.c.d': 'deep' });
    expect(ctx).toEqual({ a: { b: { c: { d: 'deep' } } } });
  });

  it('handles empty input', () => {
    expect(buildCelContext({})).toEqual({});
  });
});

// ============================================================
// extractFieldRefs
// ============================================================

describe('extractFieldRefs', () => {
  it('extracts single field from simple expression', () => {
    expect(extractFieldRefs("method == 'oauth2'")).toEqual(['method']);
  });

  it('extracts dotted field ID', () => {
    expect(extractFieldRefs("jsonData.auth_method == 'oauth2'")).toEqual(['jsonData.auth_method']);
  });

  it('extracts multiple fields from AND expression', () => {
    const refs = extractFieldRefs("jsonData.auth_method == 'oauth2' && jsonData.oauth2.oauth2_type == 'jwt'");
    expect(refs).toContain('jsonData.auth_method');
    expect(refs).toContain('jsonData.oauth2.oauth2_type');
    expect(refs).toHaveLength(2);
  });

  it('extracts multiple fields from OR expression', () => {
    const refs = extractFieldRefs("field1 == 'a' || field2 != 'b'");
    expect(refs).toContain('field1');
    expect(refs).toContain('field2');
  });

  it('deduplicates repeated fields', () => {
    const refs = extractFieldRefs("method == 'a' || method == 'b'");
    expect(refs).toEqual(['method']);
  });

  it('handles complex nested expression', () => {
    const refs = extractFieldRefs("(a == 'x' || b == 'y') && c != 'z'");
    expect(refs).toContain('a');
    expect(refs).toContain('b');
    expect(refs).toContain('c');
    expect(refs).toHaveLength(3);
  });

  it('returns empty array for expression without comparisons', () => {
    expect(extractFieldRefs('true')).toEqual([]);
  });
});

// ============================================================
// isValidCelExpression
// ============================================================

describe('isValidCelExpression', () => {
  it('returns true for valid simple expression', () => {
    expect(isValidCelExpression("method == 'oauth2'")).toBe(true);
  });

  it('returns true for compound expression', () => {
    expect(isValidCelExpression("a == 'x' && b == 'y'")).toBe(true);
  });

  it('returns true for parenthesized expression', () => {
    expect(isValidCelExpression("(a == 'x' || b == 'y') && c == 'z'")).toBe(true);
  });

  it('returns false for invalid expression', () => {
    expect(isValidCelExpression('== invalid')).toBe(false);
  });

  it('returns false for empty expression', () => {
    expect(isValidCelExpression('')).toBe(false);
  });
});

// ============================================================
// CEL advanced features (available but not primary use case)
// ============================================================

describe('CEL advanced features', () => {
  it('in operator for list membership', () => {
    expect(evaluateCelExpression("'admin' in roles", { roles: ['admin', 'user'] })).toBe(true);
    expect(evaluateCelExpression("'viewer' in roles", { roles: ['admin', 'user'] })).toBe(false);
  });

  it('ternary operator', () => {
    const result = evaluateCelDirect("enabled ? 'yes' : 'no'", { enabled: true });
    expect(result).toBe('yes');
  });

  it('string concatenation', () => {
    const result = evaluateCelDirect("prefix + '.suffix'", { prefix: 'hello' });
    expect(result).toBe('hello.suffix');
  });

  it('comparison operators', () => {
    expect(evaluateCelExpression('count > 5', { count: 10 })).toBe(true);
    expect(evaluateCelExpression('count > 5', { count: 3 })).toBe(false);
    expect(evaluateCelExpression('count >= 5', { count: 5 })).toBe(true);
    expect(evaluateCelExpression('count < 5', { count: 3 })).toBe(true);
  });

  it('has() macro for checking field existence', () => {
    expect(evaluateCelExpression('has(config.auth)', { config: { auth: 'oauth2' } })).toBe(true);
    expect(evaluateCelExpression('has(config.missing)', { config: {} })).toBe(false);
  });

  it('size() macro for arrays', () => {
    expect(evaluateCelExpression('size(items) > 0', { items: ['a', 'b'] })).toBe(true);
    expect(evaluateCelExpression('size(items) > 0', { items: [] })).toBe(false);
  });
});
