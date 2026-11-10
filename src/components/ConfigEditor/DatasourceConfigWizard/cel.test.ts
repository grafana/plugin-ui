import {
  buildCelContext,
  evaluateCelExpression,
  isValidCelExpression,
  extractFieldRefs,
  clearExpressionCache,
} from './cel';

describe('cel', () => {
  afterEach(() => {
    clearExpressionCache();
  });

  describe('extractFieldRefs', () => {
    it('extracts a single field ref', () => {
      expect(extractFieldRefs("a == 'x'")).toEqual(['a']);
    });

    it('extracts refs from both sides of a compound expression', () => {
      expect(extractFieldRefs("a == 'x' && b != 'y'")).toEqual(['a', 'b']);
    });

    it('supports dotted field ids', () => {
      expect(extractFieldRefs("jsonData.auth == 'oauth'")).toEqual(['jsonData.auth']);
    });

    it('de-duplicates repeated refs', () => {
      expect(extractFieldRefs("a == 'x' || a == 'y'")).toEqual(['a']);
    });

    it('returns an empty array when there are no comparisons', () => {
      expect(extractFieldRefs('true')).toEqual([]);
    });
  });

  describe('evaluateCelExpression', () => {
    it('evaluates a matching equality to true', () => {
      expect(evaluateCelExpression("a == 'x'", { a: 'x' })).toBe(true);
    });

    it('evaluates a non-matching equality to false', () => {
      expect(evaluateCelExpression("a == 'x'", { a: 'y' })).toBe(false);
    });

    it('evaluates nested (dotted) references against a nested context', () => {
      expect(evaluateCelExpression("jsonData.auth == 'oauth'", { jsonData: { auth: 'oauth' } })).toBe(true);
    });

    it('evaluates compound && expressions', () => {
      expect(evaluateCelExpression("a == 'x' && b == true", { a: 'x', b: true })).toBe(true);
    });

    it('returns the default value for an empty expression', () => {
      expect(evaluateCelExpression('', {})).toBe(false);
      expect(evaluateCelExpression('   ', {}, true)).toBe(true);
    });

    it('returns the default value for an unparseable expression', () => {
      expect(evaluateCelExpression('!!!nope!!!', {})).toBe(false);
      expect(evaluateCelExpression('!!!nope!!!', {}, true)).toBe(true);
    });

    it('coerces truthy/falsy results to a boolean', () => {
      expect(evaluateCelExpression('a', { a: 'non-empty' })).toBe(true);
      expect(evaluateCelExpression('a', { a: '' })).toBe(false);
    });
  });

  describe('buildCelContext', () => {
    it('expands a single dotted key into a nested object', () => {
      expect(buildCelContext({ 'a.b': 1 })).toEqual({ a: { b: 1 } });
    });

    it('expands deeply dotted keys', () => {
      expect(buildCelContext({ 'a.b.c': true })).toEqual({ a: { b: { c: true } } });
    });

    it('keeps non-dotted keys flat and merges siblings', () => {
      expect(buildCelContext({ 'a.b': 1, 'a.c': 2, d: 3 })).toEqual({ a: { b: 1, c: 2 }, d: 3 });
    });
  });

  describe('isValidCelExpression', () => {
    it('returns true for a parseable expression', () => {
      expect(isValidCelExpression("a == 'x'")).toBe(true);
    });

    it('returns false for an unbalanced/unparseable expression', () => {
      expect(isValidCelExpression('(((')).toBe(false);
    });
  });
});
