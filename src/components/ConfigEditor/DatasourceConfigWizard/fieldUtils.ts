import type { ConfigField } from '../../../datasource/schema/schema';
import { parseDependsOn, formKey } from '../../../datasource/schema/config';
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
  fieldById: Map<string, ConfigField>
): boolean {
  if (field.required) {
    return true;
  }
  if (field.requiredWhen) {
    const parsed = parseDependsOn(field.requiredWhen);
    if (parsed) {
      const depField = fieldById.get(parsed.field);
      const depKey = depField ? formKey(depField) : parsed.field;
      return String(watchedValues[depKey] ?? '') === parsed.value;
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
