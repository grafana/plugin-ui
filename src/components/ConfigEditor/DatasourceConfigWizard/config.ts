/**
 * Pure helper functions for working with DatasourceConfigSchema.
 *
 * Types are defined in schema.ts — import them from there directly.
 */

import { extractFieldRefs } from './cel';
import type { DatasourceConfigSchema, ConfigField, ConfigGroup, FieldOverride } from '../../../schema';

/**
 * Group ids that denote the authentication section. Registry schemas use the
 * full form `authentication`; `auth` is accepted for backwards compatibility
 * with older/short-form schemas.
 */
export const AUTH_GROUP_IDS: readonly string[] = ['authentication', 'auth'];

/** Whether a group id denotes the authentication group. */
export function isAuthGroupId(id: string): boolean {
  return AUTH_GROUP_IDS.includes(id);
}

/**
 * Resolve a schema's groups into arrays of ConfigField objects.
 * If the schema has no groups, returns a single group containing all non-virtual fields.
 */
export function resolveGroups(schema: DatasourceConfigSchema): Array<{ group: ConfigGroup; fields: ConfigField[] }> {
  const fieldMap = new Map<string, ConfigField>();
  for (const f of schema.fields) {
    fieldMap.set(f.id, f);
  }

  if (schema.groups && schema.groups.length > 0) {
    return schema.groups
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((g) => ({
        group: g,
        fields: g.fieldRefs.map((ref) => fieldMap.get(ref)).filter((f): f is ConfigField => f != null),
      }));
  }

  // No groups: single step with all storage fields
  const allFields = schema.fields.filter((f) => f.kind !== 'virtual' && !f.isItemField);
  return [
    {
      group: { id: 'default', title: 'Configuration', fieldRefs: allFields.map((f) => f.id) },
      fields: allFields,
    },
  ];
}

/**
 * Build a virtual "Required" group containing all required fields, any parent
 * fields they depend on (via `dependsOn`), and any child fields that depend on
 * required fields.  When the schema contains an authentication group (id
 * `authentication` or `auth`), its fields are also pulled in (auth is
 * effectively required for Prometheus/Loki/Tempo style datasources).  Fields
 * are returned in schema order and de-duplicated.
 * Returns `null` when the virtual group would be empty.
 */
export function resolveRequiredFieldsGroup(
  schema: DatasourceConfigSchema
): { group: ConfigGroup; fields: ConfigField[] } | null {
  const fieldMap = new Map<string, ConfigField>();
  for (const f of schema.fields) {
    fieldMap.set(f.id, f);
  }

  const requiredIds = new Set<string>();
  for (const f of schema.fields) {
    if (f.required || f.tags?.includes('pinned')) {
      requiredIds.add(f.id);
    }
  }

  // Include all fields from the authentication group as effectively required
  const authGroup = schema.groups?.find((g) => isAuthGroupId(g.id));
  if (authGroup) {
    for (const ref of authGroup.fieldRefs) {
      if (fieldMap.has(ref)) {
        requiredIds.add(ref);
      }
    }
  }

  if (requiredIds.size === 0) {
    return null;
  }

  const includeIds = new Set<string>();

  // Required fields + parent fields they depend on
  for (const id of requiredIds) {
    includeIds.add(id);
    const f = fieldMap.get(id);
    if (f?.dependsOn) {
      for (const ref of extractFieldRefs(f.dependsOn)) {
        if (fieldMap.has(ref)) {
          includeIds.add(ref);
        }
      }
    }
  }

  // Child fields that depend on any required field
  for (const f of schema.fields) {
    if (f.dependsOn && !includeIds.has(f.id)) {
      const refs = extractFieldRefs(f.dependsOn);
      if (refs.some((ref) => requiredIds.has(ref))) {
        includeIds.add(f.id);
      }
    }
  }

  const virtualFields = schema.fields.filter((f) => includeIds.has(f.id));
  if (virtualFields.length === 0) {
    return null;
  }

  return {
    group: {
      id: '_required',
      title: 'General',
      fieldRefs: virtualFields.map((f) => f.id),
    },
    fields: virtualFields,
  };
}

/**
 * Unique form key for a field. Section-scoped fields (e.g. section:"logs", key:"defaultTable")
 * get a prefixed key ("logs.defaultTable") so they don't collide with top-level fields that
 * share the same key name.
 */
export function formKey(field: ConfigField): string {
  return field.section ? `${field.section}.${field.key}` : field.key;
}

/**
 * Resolve a possibly-dotted key against watchedValues from react-hook-form.
 * RHF's `watch()` returns nested objects for dotted Controller names
 * (e.g. "logs.otelEnabled" → { logs: { otelEnabled: true } }),
 * so a flat `obj["logs.otelEnabled"]` lookup misses.
 *
 * For dotted keys we must try the nested path **first**: react-hook-form's
 * Controller `onChange` writes nested objects via its internal `set()`, but
 * `reset()` may have created a flat dotted key with the same name.  After user
 * interaction the nested value is authoritative; the stale flat key must not
 * shadow it.  This mirrors RHF's own `get()` semantics (nested-first, flat
 * fallback).
 */
export function getWatchedValue(watchedValues: Record<string, unknown>, key: string): unknown {
  // For dotted keys, prefer the nested path walk.
  if (key.includes('.')) {
    const parts = key.split('.');
    let current: unknown = watchedValues;
    for (const part of parts) {
      if (current == null || typeof current !== 'object') {
        // Nested path doesn't exist — fall back to flat key
        return watchedValues[key];
      }
      current = (current as Record<string, unknown>)[part];
    }
    if (current !== undefined) {
      return current;
    }
    // Nested walk yielded undefined — try flat key as fallback
    return watchedValues[key];
  }
  // Non-dotted key: direct property access
  return watchedValues[key];
}

/**
 * Parse a simple CEL-like dependsOn expression: "fieldId == 'value'" or "fieldId != 'value'".
 * Only single comparisons are supported — no &&, ||, or parentheses.
 * Field IDs may contain dots and underscores (e.g. "jsonData.oauth2.oauth2_type").
 * Values may be single-quoted, double-quoted, or unquoted literals (true/false/numbers).
 * Returns { field, value, negate } or null if unparseable.
 */
export function parseDependsOn(expr: string): { field: string; value: string; negate: boolean } | null {
  // Match: fieldRef == 'value' | fieldRef == "value" | fieldRef == literal
  // Field ref: word chars and dots, no parens/operators.
  // Unquoted values: non-whitespace, no quotes, no logical operators.
  const m = expr.match(/^([\w.]+)\s*(==|!=)\s*(?:'([^']*)'|"([^"]*)"|(\S+))$/);
  if (!m) {
    return null;
  }
  return { field: m[1], value: (m[3] ?? m[4] ?? m[5]).trim(), negate: m[2] === '!=' };
}

/**
 * Evaluate a parsed dependsOn condition against a value.
 * Handles both == and != operators.
 */
export function evaluateDependsOn(parsed: { value: string; negate: boolean }, currentValue: unknown): boolean {
  const matches = String(currentValue ?? '') === parsed.value;
  return parsed.negate ? !matches : matches;
}

/**
 * Resolve the first matching override for a field given current form values.
 * Override `when` uses the same "fieldId == 'value'" syntax as dependsOn.
 * Returns the matching override or undefined if none match.
 */
export function resolveActiveOverride(
  field: ConfigField,
  watchedValues: Record<string, unknown>,
  fieldById: Map<string, ConfigField>
): FieldOverride | undefined {
  if (!field.overrides || field.overrides.length === 0) {
    return undefined;
  }
  for (const ov of field.overrides) {
    const parsed = parseDependsOn(ov.when);
    if (!parsed) {
      continue;
    }
    const depField = fieldById.get(parsed.field);
    const depKey = depField ? formKey(depField) : parsed.field;
    if (evaluateDependsOn(parsed, getWatchedValue(watchedValues, depKey))) {
      return ov;
    }
  }
  return undefined;
}

/**
 * Resolve a field reference like "root.basicAuth" or "jsonData.oauthPassThru"
 * to its current value from a flat form values map, using the schema's field definitions.
 */
function resolveFieldValue(ref: string, values: Record<string, unknown>, fields: ConfigField[]): unknown {
  // Try direct match on formKey first
  if (ref in values) {
    return values[ref];
  }
  // Try matching by field ID → formKey
  const field = fields.find((f) => f.id === ref);
  if (field) {
    const fk = formKey(field);
    if (fk in values) {
      return values[fk];
    }
  }
  return undefined;
}

/**
 * Evaluate a simple computed.read expression against form values.
 * Supports patterns used in dsconfig schemas:
 *   - "fieldRef == true ? 'a' : (fieldRef == true ? 'b' : 'c')"
 *   - Simple ternary chains with equality checks
 * Falls back to the field's defaultValue if the expression can't be evaluated.
 */
export function evaluateComputedRead(expr: string, values: Record<string, unknown>, fields: ConfigField[]): unknown {
  // Recursively evaluate ternary: condition ? trueVal : falseVal
  function evalExpr(s: string): unknown {
    s = s.trim();

    // Strip outer parens
    if (s.startsWith('(') && findMatchingParen(s, 0) === s.length - 1) {
      s = s.slice(1, -1).trim();
    }

    // Ternary: find top-level "?"
    const qIdx = findTopLevel(s, '?');
    if (qIdx !== -1) {
      const condition = s.slice(0, qIdx).trim();
      const rest = s.slice(qIdx + 1);
      const cIdx = findTopLevel(rest, ':');
      if (cIdx !== -1) {
        const trueExpr = rest.slice(0, cIdx).trim();
        const falseExpr = rest.slice(cIdx + 1).trim();
        return evalCondition(condition) ? evalExpr(trueExpr) : evalExpr(falseExpr);
      }
    }

    // String literal
    const strMatch = s.match(/^'([^']*)'$/) ?? s.match(/^"([^"]*)"$/);
    if (strMatch) {
      return strMatch[1];
    }
    // Boolean/number literals
    if (s === 'true') {
      return true;
    }
    if (s === 'false') {
      return false;
    }
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      return Number(s);
    }

    // Field reference
    return resolveFieldValue(s, values, fields);
  }

  function evalCondition(cond: string): boolean {
    // "ref == value" or "ref != value"
    const eqMatch = cond.match(/^(.+?)\s*(==|!=)\s*(.+)$/);
    if (eqMatch) {
      const left = evalExpr(eqMatch[1]);
      const right = evalExpr(eqMatch[3]);
      const eq = String(left) === String(right);
      return eqMatch[2] === '==' ? eq : !eq;
    }
    // Truthy check
    return !!evalExpr(cond);
  }

  function findMatchingParen(s: string, start: number): number {
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      if (s[i] === '(') {
        depth++;
      } else if (s[i] === ')') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  function findTopLevel(s: string, char: string): number {
    let depth = 0;
    let inStr: string | null = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (c === inStr) {
          inStr = null;
        }
        continue;
      }
      if (c === "'" || c === '"') {
        inStr = c;
        continue;
      }
      if (c === '(') {
        depth++;
        continue;
      }
      if (c === ')') {
        depth--;
        continue;
      }
      if (depth === 0 && c === char) {
        return i;
      }
    }
    return -1;
  }

  try {
    return evalExpr(expr);
  } catch {
    return undefined;
  }
}

/**
 * Compute initial values for all virtual fields that have storage.computed.read expressions.
 * Call after loading existing storage field values.
 */
export function computeVirtualFieldValues(
  schema: DatasourceConfigSchema,
  existingValues: Record<string, unknown>
): Record<string, unknown> {
  const virtualValues: Record<string, unknown> = {};
  for (const field of schema.fields) {
    if (field.kind !== 'virtual') {
      continue;
    }
    const fk = formKey(field);
    if (field.storage?.type === 'computed' && field.storage.read) {
      const val = evaluateComputedRead(field.storage.read, existingValues, schema.fields);
      if (val !== undefined) {
        virtualValues[fk] = val;
      } else if (field.defaultValue !== undefined) {
        virtualValues[fk] = field.defaultValue;
      }
    } else if (field.defaultValue !== undefined) {
      virtualValues[fk] = field.defaultValue;
    }
  }
  return virtualValues;
}
