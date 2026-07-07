import type { ConfigField } from '../../../schema/schema';
import { SECURE_FIELD_CONFIGURED } from './datasource';
import { evaluateEffectCondition, isFieldRequired, buildValidationRules, parseItemErrors } from './fieldUtils';

const field = (partial: Partial<ConfigField> & { id: string; key: string }): ConfigField => ({
  valueType: 'string',
  ...partial,
});

type ValidateFn = (value: unknown) => true | string;

describe('evaluateEffectCondition', () => {
  it('matches a quoted string value', () => {
    expect(evaluateEffectCondition("value == 'basic'", 'basic')).toBe(true);
    expect(evaluateEffectCondition("value == 'basic'", 'other')).toBe(false);
  });

  it('matches a boolean literal', () => {
    expect(evaluateEffectCondition('value == true', true)).toBe(true);
    expect(evaluateEffectCondition('value == true', false)).toBe(false);
  });

  it('handles inequality', () => {
    expect(evaluateEffectCondition("value != 'x'", 'y')).toBe(true);
    expect(evaluateEffectCondition("value != 'x'", 'x')).toBe(false);
  });

  it('coerces numeric literals', () => {
    expect(evaluateEffectCondition('value == 5', 5)).toBe(true);
  });

  it('returns false when the expression does not start with "value"', () => {
    expect(evaluateEffectCondition("foo == 'x'", 'x')).toBe(false);
  });
});

describe('isFieldRequired', () => {
  it('is true for a statically required field', () => {
    expect(isFieldRequired(field({ id: 'a', key: 'a', required: true }), {}, new Map())).toBe(true);
  });

  it('evaluates requiredWhen via CEL when a context is provided', () => {
    const f = field({ id: 'pw', key: 'pw', requiredWhen: 'basicAuth == true' });
    expect(isFieldRequired(f, {}, new Map(), { basicAuth: true })).toBe(true);
    expect(isFieldRequired(f, {}, new Map(), { basicAuth: false })).toBe(false);
  });

  it('falls back to the simple parser when no CEL context is given', () => {
    const dep = field({ id: 'dep', key: 'dep' });
    const f = field({ id: 'pw', key: 'pw', requiredWhen: "dep == 'x'" });
    const fieldById = new Map([
      ['dep', dep],
      ['pw', f],
    ]);
    expect(isFieldRequired(f, { dep: 'x' }, fieldById)).toBe(true);
    expect(isFieldRequired(f, { dep: 'y' }, fieldById)).toBe(false);
  });

  it('is false when neither required nor requiredWhen apply', () => {
    expect(isFieldRequired(field({ id: 'a', key: 'a' }), {}, new Map())).toBe(false);
  });
});

describe('buildValidationRules', () => {
  it('sets a required message for a non-secure required field', () => {
    const rules = buildValidationRules(field({ id: 'a', key: 'server', label: 'Server' }), true);
    expect(rules.required).toBe('Server is required');
  });

  it('uses a custom validator for required secure fields (allowing the configured sentinel)', () => {
    const rules = buildValidationRules(
      field({ id: 'pw', key: 'password', label: 'Password', target: 'secureJsonData' }),
      true
    );
    const validate = rules.validate as ValidateFn;
    expect(validate(SECURE_FIELD_CONFIGURED)).toBe(true);
    expect(validate('')).toBe('Password is required');
    expect(validate('secret')).toBe(true);
  });

  it('maps pattern validations to an RHF pattern rule', () => {
    const rules = buildValidationRules(
      field({ id: 'a', key: 'a', validations: [{ type: 'pattern', pattern: '^a+$', message: 'bad' }] }),
      false
    );
    const pattern = rules.pattern as { value: RegExp; message: string };
    expect(pattern.value).toBeInstanceOf(RegExp);
    expect(pattern.value.test('aaa')).toBe(true);
    expect(pattern.message).toBe('bad');
  });

  it('maps range and length validations', () => {
    const range = buildValidationRules(
      field({ id: 'a', key: 'a', valueType: 'number', validations: [{ type: 'range', min: 1, max: 10 }] }),
      false
    );
    expect((range.min as { value: number }).value).toBe(1);
    expect((range.max as { value: number }).value).toBe(10);

    const length = buildValidationRules(
      field({ id: 'a', key: 'a', validations: [{ type: 'length', min: 2, max: 5 }] }),
      false
    );
    expect((length.minLength as { value: number }).value).toBe(2);
    expect((length.maxLength as { value: number }).value).toBe(5);
  });

  it('encodes per-item errors for object arrays with required item fields', () => {
    const arrField = field({
      id: 'df',
      key: 'derivedFields',
      valueType: 'array',
      target: 'jsonData',
      item: { valueType: 'object', fields: [field({ id: 'n', key: 'name', isItemField: true, required: true })] },
    });
    const validate = buildValidationRules(arrField, false).validate as ValidateFn;
    expect(validate([{ name: 'ok' }])).toBe(true);
    const encoded = validate([{ name: '' }]);
    expect(encoded).toBe('__ITEM_ERRORS__{"0":"name required"}');
    // Round-trips through parseItemErrors.
    expect(parseItemErrors(encoded as string)).toEqual({ 0: 'name required' });
  });
});

describe('parseItemErrors', () => {
  it('returns null for undefined or non-item messages', () => {
    expect(parseItemErrors(undefined)).toBeNull();
    expect(parseItemErrors('some normal error')).toBeNull();
  });

  it('decodes an encoded item-error map', () => {
    expect(parseItemErrors('__ITEM_ERRORS__{"0":"a required","2":"b required"}')).toEqual({
      0: 'a required',
      2: 'b required',
    });
  });

  it('returns null when the encoded payload is malformed JSON', () => {
    expect(parseItemErrors('__ITEM_ERRORS__{not json')).toBeNull();
  });
});
