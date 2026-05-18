import type { ConfigField } from '../../../datasource/schema/schema';
import {
  parseDependsOn,
  evaluateDependsOn,
  formKey,
  getWatchedValue,
  evaluateCelExpression,
} from '../../../datasource/schema/config';
import { SECURE_FIELD_CONFIGURED } from '../../../datasource/schema/datasource';

/**
 * Evaluate an effect's `when` condition against a field value.
 * Supports: "value == 'literal'", "value == true", "value != 'literal'"
 * The keyword `value` refers to the current value of the source field.
 */
export function evaluateEffectCondition(when: string, fieldValue: unknown): boolean {
  const m = when.match(/^value\s*(==|!=)\s*(?:'([^']*)'|"([^"]*)"|(.+))$/);
  if (!m) {
    return false;
  }
  const op = m[1];
  let target: unknown = m[2] ?? m[3] ?? m[4];
  if (target === 'true') {
    target = true;
  } else if (target === 'false') {
    target = false;
  } else if (typeof target === 'string' && /^-?\d+(\.\d+)?$/.test(target)) {
    target = Number(target);
  }

  const eq = String(fieldValue) === String(target);
  return op === '==' ? eq : !eq;
}

/**
 * Evaluate whether a field is currently required, considering both the static
 * `required` flag and the conditional `requiredWhen` expression.
 */
export function isFieldRequired(
  field: ConfigField,
  watchedValues: Record<string, unknown>,
  fieldById: Map<string, ConfigField>,
  celContext?: Record<string, unknown>
): boolean {
  if (field.required) {
    return true;
  }
  if (field.requiredWhen) {
    // Use CEL evaluation if context is available (supports compound expressions)
    if (celContext) {
      return evaluateCelExpression(field.requiredWhen, celContext);
    }
    // Fallback to simple parser for backward compatibility
    const parsed = parseDependsOn(field.requiredWhen);
    if (parsed) {
      const depField = fieldById.get(parsed.field);
      const depKey = depField ? formKey(depField) : parsed.field;
      return evaluateDependsOn(parsed, getWatchedValue(watchedValues, depKey));
    }
  }
  return false;
}

export function buildValidationRules(field: ConfigField, required: boolean) {
  const rules: Record<string, unknown> = {};
  const label = field.label ?? field.key;

  if (required) {
    if (field.target === 'secureJsonData') {
      rules.validate = (value: unknown) => {
        if (value === SECURE_FIELD_CONFIGURED) {
          return true;
        }
        if (!value || value === '') {
          return `${label} is required`;
        }
        return true;
      };
    } else {
      rules.required = `${label} is required`;
    }
  }

  // Validate required item fields inside object arrays.
  // Returns a JSON-encoded map of {itemIndex: "message"} so ObjectArrayEditor
  // can render errors inline per item. react-hook-form treats any non-true
  // string as an error message.
  if (field.valueType === 'array' && field.item?.valueType === 'object' && field.item.fields?.length) {
    const requiredItemFields = field.item.fields.filter((f) => f.required);
    if (requiredItemFields.length > 0) {
      const existingValidate = rules.validate as ((v: unknown) => true | string) | undefined;
      rules.validate = (value: unknown) => {
        if (existingValidate) {
          const r = existingValidate(value);
          if (r !== true) {
            return r;
          }
        }
        if (!Array.isArray(value)) {
          return true;
        }
        const itemErrors: Record<number, string> = {};
        for (let i = 0; i < value.length; i++) {
          const item = value[i] as Record<string, unknown>;
          const missing: string[] = [];
          for (const rf of requiredItemFields) {
            const v = item[rf.key];
            if (v === undefined || v === null || v === '') {
              missing.push(rf.label ?? rf.key);
            }
          }
          if (missing.length > 0) {
            itemErrors[i] = `${missing.join(', ')} required`;
          }
        }
        if (Object.keys(itemErrors).length === 0) {
          return true;
        }
        // Encode as JSON so ObjectArrayEditor can parse and show per-item
        return `__ITEM_ERRORS__${JSON.stringify(itemErrors)}`;
      };
    }
  }

  if (field.validations) {
    for (const v of field.validations) {
      switch (v.type) {
        case 'pattern':
          rules.pattern = {
            value: new RegExp(v.pattern),
            message: v.message ?? `Invalid ${label}`,
          };
          break;
        case 'range':
          if (v.min !== undefined) {
            rules.min = { value: v.min, message: v.message ?? `Minimum value is ${v.min}` };
          }
          if (v.max !== undefined) {
            rules.max = { value: v.max, message: v.message ?? `Maximum value is ${v.max}` };
          }
          break;
        case 'length':
          if (v.min !== undefined) {
            rules.minLength = { value: v.min, message: v.message ?? `Minimum length is ${v.min}` };
          }
          if (v.max !== undefined) {
            rules.maxLength = { value: v.max, message: v.message ?? `Maximum length is ${v.max}` };
          }
          break;
      }
    }
  }

  return rules;
}
const ITEM_ERRORS_PREFIX = '__ITEM_ERRORS__';

/**
 * Parse a per-item error message encoded by buildValidationRules.
 * Returns a map of item index → error message, or null if not an item error.
 */
export function parseItemErrors(errorMessage: string | undefined): Record<number, string> | null {
  if (!errorMessage || !errorMessage.startsWith(ITEM_ERRORS_PREFIX)) {
    return null;
  }
  try {
    return JSON.parse(errorMessage.slice(ITEM_ERRORS_PREFIX.length));
  } catch {
    return null;
  }
}
