/**
 * Pure "interpreter" helpers for the datasource config form.
 *
 * These derive UI state (CEL context, field visibility/disabled, group
 * validity/data) purely from a schema snapshot + current form values, with no
 * React or form-library dependency. `useDatasourceConfigForm` wires them into
 * memoized callbacks; keeping them pure makes the logic independently testable.
 */

import type { ConfigField } from '../../../../schema/schema';
import { formKey, getWatchedValue, type ResolvedGroup } from '../config';
import { extractFieldRefs, evaluateCelExpression } from '../cel';
import { isFieldRequired } from '../inputs/fieldUtils';
import { SECURE_FIELD_CONFIGURED } from '../datasource';

/**
 * Build a CEL-compatible nested context from flat watched values + field ID mappings.
 * Field IDs like "jsonData.auth_method" become { jsonData: { auth_method: value } }.
 */
export function buildFieldCelContext(
  fieldById: Map<string, ConfigField>,
  watchedValues: Record<string, unknown>
): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  for (const f of fieldById.values()) {
    const fk = formKey(f);
    const val = getWatchedValue(watchedValues, fk);
    if (val !== undefined) {
      // Set by field ID path (e.g. "jsonData.oauth2.oauth2_type")
      const parts = f.id.split('.');
      let current = ctx as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in current) || typeof current[parts[i]] !== 'object' || current[parts[i]] === null) {
          current[parts[i]] = {};
        }
        current = current[parts[i]] as Record<string, unknown>;
      }
      current[parts[parts.length - 1]] = val;
    }
  }
  return ctx;
}

/**
 * Whether a field should be shown. Hidden when it's a virtual field without UI,
 * managed by an effect, or its (transitive) `dependsOn` chain evaluates falsy.
 */
export function isFieldVisible(
  field: ConfigField,
  fieldById: Map<string, ConfigField>,
  celContext: Record<string, unknown>
): boolean {
  // Inner recursive helper with a visited set to guard against circular deps.
  function check(f: ConfigField, visited: Set<string>): boolean {
    if (f.kind === 'virtual' && !f.ui) {
      return false;
    }
    if (f.tags?.some((t) => t.startsWith('managed-by:'))) {
      return false;
    }
    if (!f.dependsOn) {
      return true;
    }

    // Transitive visibility: all referenced dependency fields must themselves be visible.
    const refs = extractFieldRefs(f.dependsOn);
    for (const ref of refs) {
      const depField = fieldById.get(ref);
      if (depField && !visited.has(depField.id)) {
        visited.add(f.id);
        if (!check(depField, visited)) {
          return false;
        }
      }
    }

    // Evaluate the full CEL expression
    return evaluateCelExpression(f.dependsOn, celContext);
  }
  return check(field, new Set<string>());
}

/** Whether a field is currently disabled via its `disabledWhen` CEL expression. */
export function isFieldDisabled(field: ConfigField, celContext: Record<string, unknown>): boolean {
  if (!field.disabledWhen) {
    return false;
  }
  return evaluateCelExpression(field.disabledWhen, celContext);
}

/** Check whether all visible required fields in a group have a value (and no errors). */
export function isGroupValid(
  group: ResolvedGroup,
  args: {
    watchedValues: Record<string, unknown>;
    fieldById: Map<string, ConfigField>;
    celContext: Record<string, unknown>;
    errors: Record<string, unknown>;
    isVisible: (field: ConfigField) => boolean;
  }
): boolean {
  const { watchedValues, fieldById, celContext, errors, isVisible } = args;
  for (const field of group.fields) {
    if (!isVisible(field)) {
      continue;
    }
    if (errors[formKey(field)]) {
      return false;
    }
    if (isFieldRequired(field, watchedValues, fieldById, celContext)) {
      const val = getWatchedValue(watchedValues, formKey(field));
      if (val === SECURE_FIELD_CONFIGURED) {
        continue;
      }
      if (val === undefined || val === null || val === '') {
        return false;
      }
    }
  }
  return true;
}

/** Whether a group has any field with a non-default, non-empty value. */
export function groupHasData(group: ResolvedGroup, watchedValues: Record<string, unknown>): boolean {
  for (const field of group.fields) {
    const val = getWatchedValue(watchedValues, formKey(field));
    if (val === undefined || val === null || val === '' || val === false) {
      continue;
    }
    if (val === field.defaultValue) {
      continue;
    }
    return true;
  }
  return false;
}
