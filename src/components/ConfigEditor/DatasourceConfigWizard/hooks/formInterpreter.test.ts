import type { ConfigField, ConfigGroup } from '../../../../schema/schema';
import { type ResolvedGroup } from '../config';
import { SECURE_FIELD_CONFIGURED } from '../datasource';
import { buildFieldCelContext, isFieldVisible, isFieldDisabled, isGroupValid, groupHasData } from './formInterpreter';

const field = (partial: Partial<ConfigField> & { id: string; key: string }): ConfigField => ({
  valueType: 'string',
  ...partial,
});

const mapOf = (...fields: ConfigField[]): Map<string, ConfigField> => new Map(fields.map((f) => [f.id, f]));

const groupOf = (fields: ConfigField[], overrides?: Partial<ConfigGroup>): ResolvedGroup => ({
  group: { id: 'g', title: 'G', fieldRefs: fields.map((f) => f.id), ...overrides },
  fields,
});

describe('buildFieldCelContext', () => {
  it('maps a flat field value by its id', () => {
    const f = field({ id: 'server', key: 'server' });
    expect(buildFieldCelContext(mapOf(f), { server: 'localhost' })).toEqual({ server: 'localhost' });
  });

  it('nests a dotted field id into nested objects', () => {
    const f = field({ id: 'jsonData.auth_method', key: 'auth_method' });
    expect(buildFieldCelContext(mapOf(f), { auth_method: 'oauth2' })).toEqual({
      jsonData: { auth_method: 'oauth2' },
    });
  });

  it('merges sibling fields under a shared prefix', () => {
    const a = field({ id: 'jsonData.a', key: 'a' });
    const b = field({ id: 'jsonData.b', key: 'b' });
    expect(buildFieldCelContext(mapOf(a, b), { a: 1, b: 2 })).toEqual({ jsonData: { a: 1, b: 2 } });
  });

  it('reads section-scoped values via formKey', () => {
    const f = field({ id: 'x.y', key: 'y', section: 'sec' });
    expect(buildFieldCelContext(mapOf(f), { 'sec.y': 'v' })).toEqual({ x: { y: 'v' } });
  });

  it('skips fields whose watched value is undefined', () => {
    const a = field({ id: 'a', key: 'a' });
    const b = field({ id: 'b', key: 'b' });
    expect(buildFieldCelContext(mapOf(a, b), { a: 'set' })).toEqual({ a: 'set' });
  });

  it('replaces a non-object intermediate when a deeper path is set', () => {
    const scalar = field({ id: 'a', key: 'a' });
    const nested = field({ id: 'a.b', key: 'ab' });
    expect(buildFieldCelContext(mapOf(scalar, nested), { a: 'scalar', ab: 'val' })).toEqual({
      a: { b: 'val' },
    });
  });
});

describe('isFieldVisible', () => {
  it('is visible with no dependsOn on a normal field', () => {
    const f = field({ id: 'a', key: 'a' });
    expect(isFieldVisible(f, mapOf(f), {})).toBe(true);
  });

  it('hides a virtual field without ui', () => {
    const f = field({ id: 'v', key: 'v', kind: 'virtual' });
    expect(isFieldVisible(f, mapOf(f), {})).toBe(false);
  });

  it('shows a virtual field that has ui', () => {
    const f = field({ id: 'v', key: 'v', kind: 'virtual', ui: { component: 'select' } });
    expect(isFieldVisible(f, mapOf(f), {})).toBe(true);
  });

  it('hides a field managed by an effect', () => {
    const f = field({ id: 'a', key: 'a', tags: ['managed-by:auth'] });
    expect(isFieldVisible(f, mapOf(f), {})).toBe(false);
  });

  it('evaluates dependsOn against the CEL context', () => {
    const f = field({ id: 'token', key: 'token', dependsOn: "authMethod == 'oauth2'" });
    expect(isFieldVisible(f, mapOf(f), { authMethod: 'oauth2' })).toBe(true);
    expect(isFieldVisible(f, mapOf(f), { authMethod: 'basic' })).toBe(false);
  });

  it('is hidden when a transitive dependency is itself hidden', () => {
    const parent = field({ id: 'parent', key: 'parent', kind: 'virtual' });
    const child = field({ id: 'child', key: 'child', dependsOn: "parent == 'x'" });
    expect(isFieldVisible(child, mapOf(parent, child), { parent: 'x' })).toBe(false);
  });

  it('is visible when a transitive dependency is visible and the expression matches', () => {
    const parent = field({ id: 'parent', key: 'parent' });
    const child = field({ id: 'child', key: 'child', dependsOn: "parent == 'x'" });
    expect(isFieldVisible(child, mapOf(parent, child), { parent: 'x' })).toBe(true);
  });

  it('guards against circular dependencies', () => {
    const a = field({ id: 'a', key: 'a', dependsOn: "b == 'yes'" });
    const b = field({ id: 'b', key: 'b', dependsOn: "a == 'yes'" });
    expect(isFieldVisible(a, mapOf(a, b), { a: 'yes', b: 'yes' })).toBe(true);
  });
});

describe('isFieldDisabled', () => {
  it('is not disabled without disabledWhen', () => {
    expect(isFieldDisabled(field({ id: 'a', key: 'a' }), {})).toBe(false);
  });

  it('evaluates disabledWhen against the CEL context', () => {
    const f = field({ id: 'a', key: 'a', disabledWhen: 'locked == true' });
    expect(isFieldDisabled(f, { locked: true })).toBe(true);
    expect(isFieldDisabled(f, { locked: false })).toBe(false);
  });
});

describe('isGroupValid', () => {
  it('is valid when required visible fields are filled and there are no errors', () => {
    const f = field({ id: 'server', key: 'server', required: true });
    expect(
      isGroupValid(groupOf([f]), {
        watchedValues: { server: 'localhost' },
        fieldById: mapOf(f),
        celContext: {},
        errors: {},
        isVisible: () => true,
      })
    ).toBe(true);
  });

  it('is invalid when a required visible field is empty', () => {
    const f = field({ id: 'server', key: 'server', required: true });
    expect(
      isGroupValid(groupOf([f]), {
        watchedValues: {},
        fieldById: mapOf(f),
        celContext: {},
        errors: {},
        isVisible: () => true,
      })
    ).toBe(false);
  });

  it('ignores invisible fields', () => {
    const f = field({ id: 'server', key: 'server', required: true });
    expect(
      isGroupValid(groupOf([f]), {
        watchedValues: {},
        fieldById: mapOf(f),
        celContext: {},
        errors: {},
        isVisible: () => false,
      })
    ).toBe(true);
  });

  it('is invalid when a visible field has an error', () => {
    const f = field({ id: 'server', key: 'server' });
    expect(
      isGroupValid(groupOf([f]), {
        watchedValues: { server: 'localhost' },
        fieldById: mapOf(f),
        celContext: {},
        errors: { server: { type: 'required', message: 'Server is required' } },
        isVisible: () => true,
      })
    ).toBe(false);
  });

  it('treats the secure "configured" sentinel as a satisfied value', () => {
    const f = field({ id: 'pw', key: 'password', required: true, target: 'secureJsonData' });
    expect(
      isGroupValid(groupOf([f]), {
        watchedValues: { password: SECURE_FIELD_CONFIGURED },
        fieldById: mapOf(f),
        celContext: {},
        errors: {},
        isVisible: () => true,
      })
    ).toBe(true);
  });

  it('ignores empty non-required fields', () => {
    const f = field({ id: 'opt', key: 'opt' });
    expect(
      isGroupValid(groupOf([f]), {
        watchedValues: {},
        fieldById: mapOf(f),
        celContext: {},
        errors: {},
        isVisible: () => true,
      })
    ).toBe(true);
  });
});

describe('groupHasData', () => {
  it('is false when every field is empty', () => {
    const a = field({ id: 'a', key: 'a' });
    const b = field({ id: 'b', key: 'b', valueType: 'boolean' });
    expect(groupHasData(groupOf([a, b]), { a: '', b: false })).toBe(false);
  });

  it('is false when values equal their defaults', () => {
    const a = field({ id: 'a', key: 'a', defaultValue: 'x' });
    expect(groupHasData(groupOf([a]), { a: 'x' })).toBe(false);
  });

  it('is true when a field holds a non-default value', () => {
    const a = field({ id: 'a', key: 'a', defaultValue: 'x' });
    expect(groupHasData(groupOf([a]), { a: 'y' })).toBe(true);
  });

  it('treats a false boolean and empty string as no data', () => {
    const flag = field({ id: 'flag', key: 'flag', valueType: 'boolean' });
    expect(groupHasData(groupOf([flag]), { flag: false })).toBe(false);
  });

  it('is true when at least one field has data', () => {
    const a = field({ id: 'a', key: 'a' });
    const b = field({ id: 'b', key: 'b' });
    expect(groupHasData(groupOf([a, b]), { a: '', b: 'set' })).toBe(true);
  });
});
