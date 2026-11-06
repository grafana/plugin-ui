/**
 * CEL (Common Expression Language) expression evaluator for schema conditions.
 *
 * Used by `dependsOn`, `requiredWhen`, `disabledWhen`, and `overrides[].when`.
 * Wraps @marcbachmann/cel-js with field-ID-aware context building.
 *
 * Go equivalent: github.com/google/cel-go
 */

import { evaluate as celEvaluate, parse as celParse } from '@marcbachmann/cel-js';

// ============================================================
// Expression cache — parse once, evaluate many times
// ============================================================

type CompiledExpr = (ctx: Record<string, unknown>) => unknown;
const exprCache = new Map<string, CompiledExpr | null>();

function getCompiled(expr: string): CompiledExpr | null {
  if (exprCache.has(expr)) {
    return exprCache.get(expr)!;
  }
  try {
    const compiled = celParse(expr);
    exprCache.set(expr, compiled);
    return compiled;
  } catch {
    exprCache.set(expr, null);
    return null;
  }
}

// ============================================================
// Context builder — flat field values → nested object for CEL
// ============================================================

/**
 * Build a nested context object from flat form values keyed by field IDs.
 *
 * CEL interprets dots as property access, so `jsonData.auth_method == 'oauth2'`
 * requires `{ jsonData: { auth_method: 'oauth2' } }`.
 *
 * This function takes flat key-value pairs (from react-hook-form `watch()`)
 * and builds the nested structure CEL expects.
 *
 * @param values - Flat map of form keys to values (e.g. `{ "auth_method": "oauth2", "oauth2.oauth2_type": "jwt" }`)
 * @param fieldIdToFormKey - Optional map from field ID to form key for translation
 */
export function buildCelContext(values: Record<string, unknown>): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(values)) {
    setNestedValue(ctx, key, value);
  }

  return ctx;
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
      current[part] = {};
    }
    current = current[part] as Record<string, unknown>;
  }
  current[parts[parts.length - 1]] = value;
}

// ============================================================
// Public API
// ============================================================

/**
 * Evaluate a CEL expression against a context of field values.
 * Returns the boolean result, or `defaultValue` if the expression is invalid.
 *
 * @example
 * ```ts
 * evaluateCelExpression("jsonData.auth_method == 'oauth2'", { jsonData: { auth_method: 'oauth2' } })
 * // => true
 *
 * evaluateCelExpression("auth_method == 'oauth2' && oauth2_type == 'jwt'", { auth_method: 'oauth2', oauth2_type: 'jwt' })
 * // => true
 * ```
 */
export function evaluateCelExpression(expr: string, context: Record<string, unknown>, defaultValue = false): boolean {
  if (!expr || !expr.trim()) {
    return defaultValue;
  }

  const compiled = getCompiled(expr);
  if (!compiled) {
    return defaultValue;
  }

  try {
    const result = compiled(context);
    return !!result;
  } catch {
    return defaultValue;
  }
}

/**
 * Evaluate a CEL expression directly using `evaluate` (no caching).
 * Useful for one-off evaluations or testing.
 */
export function evaluateCelDirect(expr: string, context: Record<string, unknown>): unknown {
  return celEvaluate(expr, context);
}

/**
 * Validate that a CEL expression can be parsed without errors.
 * Returns true if valid, false otherwise.
 */
export function isValidCelExpression(expr: string): boolean {
  try {
    celParse(expr);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract all field ID references from a simple expression.
 * Used by `resolveRequiredFieldsGroup` to find dependency relationships.
 *
 * For simple expressions like `fieldA == 'x'`, returns `['fieldA']`.
 * For compound expressions like `fieldA == 'x' && fieldB == 'y'`, returns `['fieldA', 'fieldB']`.
 *
 * This uses regex extraction (not AST walking) for simplicity and speed.
 */
export function extractFieldRefs(expr: string): string[] {
  // Match identifiers (possibly dotted) that precede == or !=
  const matches = expr.matchAll(/([\w.]+)\s*(?:==|!=)/g);
  const refs = new Set<string>();
  for (const m of matches) {
    refs.add(m[1]);
  }
  return [...refs];
}

/**
 * Clear the expression cache. Useful for testing.
 */
export function clearExpressionCache(): void {
  exprCache.clear();
}
