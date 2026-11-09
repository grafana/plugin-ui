import type { ConfigField, ConfigGroup, DatasourceConfigSchema } from '../../../schema/schema';
import {
  isAuthGroupId,
  formKey,
  getWatchedValue,
  parseDependsOn,
  evaluateDependsOn,
  resolveActiveOverride,
  evaluateComputedRead,
  resolveGroups,
  resolveRequiredFieldsGroup,
  computeVirtualFieldValues,
} from './config';

const field = (partial: Partial<ConfigField> & { id: string; key: string }): ConfigField => ({
  valueType: 'string',
  ...partial,
});

const schema = (fields: ConfigField[], groups?: ConfigGroup[]): DatasourceConfigSchema => ({
  schemaVersion: 'v2',
  pluginType: 'test',
  pluginName: 'Test',
  fields,
  groups,
});

describe('isAuthGroupId', () => {
  it.each([
    ['authentication', true],
    ['auth', true],
    ['url-and-auth', false],
    ['general', false],
    ['', false],
  ])('%s -> %s', (id, expected) => {
    expect(isAuthGroupId(id)).toBe(expected);
  });
});

describe('formKey', () => {
  it('returns the key for a top-level field', () => {
    expect(formKey(field({ id: 'a', key: 'server' }))).toBe('server');
  });

  it('prefixes the section for section-scoped fields', () => {
    expect(formKey(field({ id: 'a', key: 'defaultTable', section: 'logs' }))).toBe('logs.defaultTable');
  });
});

describe('getWatchedValue', () => {
  it('reads a non-dotted key directly', () => {
    expect(getWatchedValue({ a: 1 }, 'a')).toBe(1);
  });

  it('reads a nested value for a dotted key', () => {
    expect(getWatchedValue({ logs: { otel: true } }, 'logs.otel')).toBe(true);
  });

  it('falls back to a flat dotted key when there is no nested object', () => {
    expect(getWatchedValue({ 'logs.otel': true }, 'logs.otel')).toBe(true);
  });

  it('prefers the nested value over a stale flat key', () => {
    expect(getWatchedValue({ logs: { otel: true }, 'logs.otel': false }, 'logs.otel')).toBe(true);
  });

  it('falls back to the flat key when the nested walk yields undefined', () => {
    expect(getWatchedValue({ logs: {}, 'logs.otel': 5 }, 'logs.otel')).toBe(5);
  });

  it('falls back when an intermediate segment is not an object', () => {
    expect(getWatchedValue({ logs: 5 }, 'logs.otel')).toBeUndefined();
  });

  it('returns undefined for a missing key', () => {
    expect(getWatchedValue({}, 'nope')).toBeUndefined();
  });
});

describe('parseDependsOn', () => {
  it('parses a single-quoted equality', () => {
    expect(parseDependsOn("field == 'value'")).toEqual({ field: 'field', value: 'value', negate: false });
  });

  it('parses inequality as negate', () => {
    expect(parseDependsOn("field != 'value'")).toEqual({ field: 'field', value: 'value', negate: true });
  });

  it('parses a double-quoted value', () => {
    expect(parseDependsOn('field == "dq"')).toEqual({ field: 'field', value: 'dq', negate: false });
  });

  it('parses an unquoted literal', () => {
    expect(parseDependsOn('enabled == true')).toEqual({ field: 'enabled', value: 'true', negate: false });
  });

  it('supports dotted field ids', () => {
    expect(parseDependsOn("jsonData.auth_method == 'oauth2'")).toEqual({
      field: 'jsonData.auth_method',
      value: 'oauth2',
      negate: false,
    });
  });

  it('returns null for compound or unparseable expressions', () => {
    expect(parseDependsOn("a == 'x' && b == 'y'")).toBeNull();
    expect(parseDependsOn('nonsense')).toBeNull();
  });
});

describe('evaluateDependsOn', () => {
  it('matches equal string values', () => {
    expect(evaluateDependsOn({ value: 'x', negate: false }, 'x')).toBe(true);
    expect(evaluateDependsOn({ value: 'x', negate: false }, 'y')).toBe(false);
  });

  it('inverts when negate is set', () => {
    expect(evaluateDependsOn({ value: 'x', negate: true }, 'y')).toBe(true);
    expect(evaluateDependsOn({ value: 'x', negate: true }, 'x')).toBe(false);
  });

  it('coerces the current value to a string before comparing', () => {
    expect(evaluateDependsOn({ value: '5', negate: false }, 5)).toBe(true);
  });

  it('treats null/undefined as an empty string', () => {
    expect(evaluateDependsOn({ value: '', negate: false }, null)).toBe(true);
    expect(evaluateDependsOn({ value: 'x', negate: false }, undefined)).toBe(false);
  });
});

describe('resolveActiveOverride', () => {
  const method = field({ id: 'method', key: 'method' });

  it('returns undefined when the field has no overrides', () => {
    const target = field({ id: 't', key: 't' });
    expect(resolveActiveOverride(target, { method: 'x' }, new Map())).toBeUndefined();
  });

  it('returns the first override whose condition matches', () => {
    const target = field({
      id: 't',
      key: 't',
      overrides: [
        { when: "method == 'a'", placeholder: 'A' },
        { when: "method == 'b'", placeholder: 'B' },
      ],
    });
    const fieldById = new Map([
      ['method', method],
      ['t', target],
    ]);
    expect(resolveActiveOverride(target, { method: 'b' }, fieldById)?.placeholder).toBe('B');
    expect(resolveActiveOverride(target, { method: 'a' }, fieldById)?.placeholder).toBe('A');
  });

  it('returns undefined when no override matches', () => {
    const target = field({ id: 't', key: 't', overrides: [{ when: "method == 'a'", placeholder: 'A' }] });
    const fieldById = new Map([
      ['method', method],
      ['t', target],
    ]);
    expect(resolveActiveOverride(target, { method: 'z' }, fieldById)).toBeUndefined();
  });
});

describe('evaluateComputedRead', () => {
  const a = field({ id: 'a', key: 'a', valueType: 'boolean' });
  const b = field({ id: 'b', key: 'b' });

  it('evaluates the true branch of a ternary', () => {
    expect(evaluateComputedRead("a == true ? 'yes' : 'no'", { a: true }, [a])).toBe('yes');
  });

  it('evaluates the false branch of a ternary', () => {
    expect(evaluateComputedRead("a == true ? 'yes' : 'no'", { a: false }, [a])).toBe('no');
  });

  it('evaluates nested ternaries', () => {
    expect(evaluateComputedRead("a == 'p' ? 'x' : (b == 'q' ? 'y' : 'z')", { a: 'n', b: 'q' }, [a, b])).toBe('y');
  });

  it('resolves string, boolean and number literals', () => {
    expect(evaluateComputedRead("'hi'", {}, [])).toBe('hi');
    expect(evaluateComputedRead('true', {}, [])).toBe(true);
    expect(evaluateComputedRead('42', {}, [])).toBe(42);
  });

  it('resolves a bare field reference', () => {
    expect(evaluateComputedRead('b', { b: 'val' }, [b])).toBe('val');
  });
});

describe('resolveGroups', () => {
  it('sorts groups by order and resolves field refs', () => {
    const a = field({ id: 'a', key: 'a' });
    const b = field({ id: 'b', key: 'b' });
    const groups: ConfigGroup[] = [
      { id: 'g2', title: 'G2', order: 2, fieldRefs: ['b'] },
      { id: 'g1', title: 'G1', order: 1, fieldRefs: ['a'] },
    ];
    const resolved = resolveGroups(schema([a, b], groups));
    expect(resolved.map((r) => r.group.id)).toEqual(['g1', 'g2']);
    expect(resolved[0].fields).toEqual([a]);
  });

  it('filters out field refs that do not resolve', () => {
    const a = field({ id: 'a', key: 'a' });
    const groups: ConfigGroup[] = [{ id: 'g', title: 'G', fieldRefs: ['a', 'missing'] }];
    const resolved = resolveGroups(schema([a], groups));
    expect(resolved[0].fields).toEqual([a]);
  });

  it('returns a single default group (excluding virtual/item fields) when no groups exist', () => {
    const a = field({ id: 'a', key: 'a' });
    const v = field({ id: 'v', key: 'v', kind: 'virtual' });
    const i = field({ id: 'i', key: 'i', isItemField: true });
    const resolved = resolveGroups(schema([a, v, i]));
    expect(resolved).toHaveLength(1);
    expect(resolved[0].group.id).toBe('default');
    expect(resolved[0].fields).toEqual([a]);
  });
});

describe('resolveRequiredFieldsGroup', () => {
  it('returns null when nothing is required', () => {
    expect(resolveRequiredFieldsGroup(schema([field({ id: 'a', key: 'a' })]))).toBeNull();
  });

  it('collects required fields plus children that depend on them', () => {
    const a = field({ id: 'a', key: 'a', required: true });
    const b = field({ id: 'b', key: 'b' });
    const c = field({ id: 'c', key: 'c', dependsOn: "a == 'x'" });
    const result = resolveRequiredFieldsGroup(schema([a, b, c]));
    expect(result?.group.id).toBe('_required');
    expect(result?.fields.map((f) => f.id)).toEqual(['a', 'c']);
  });

  it('pulls in parent fields referenced by a required field dependsOn', () => {
    const parent = field({ id: 'parent', key: 'parent' });
    const child = field({ id: 'child', key: 'child', required: true, dependsOn: "parent == 'x'" });
    const result = resolveRequiredFieldsGroup(schema([parent, child]));
    expect(result?.fields.map((f) => f.id)).toEqual(['parent', 'child']);
  });

  it('treats pinned-tagged fields as required', () => {
    const a = field({ id: 'a', key: 'a', tags: ['pinned'] });
    expect(resolveRequiredFieldsGroup(schema([a]))?.fields.map((f) => f.id)).toEqual(['a']);
  });

  it('treats authentication group fields as required', () => {
    const token = field({ id: 'token', key: 'token' });
    const other = field({ id: 'other', key: 'other' });
    const groups: ConfigGroup[] = [{ id: 'authentication', title: 'Auth', fieldRefs: ['token'] }];
    const result = resolveRequiredFieldsGroup(schema([token, other], groups));
    expect(result?.fields.map((f) => f.id)).toEqual(['token']);
  });
});

describe('computeVirtualFieldValues', () => {
  it('evaluates computed.read expressions for virtual fields', () => {
    const v = field({
      id: 'v',
      key: 'authMethod',
      kind: 'virtual',
      storage: { type: 'computed', read: "basicAuth == true ? 'basic' : 'none'" },
    });
    const basicAuth = field({ id: 'basicAuth', key: 'basicAuth', valueType: 'boolean' });
    expect(computeVirtualFieldValues(schema([v, basicAuth]), { basicAuth: true })).toEqual({ authMethod: 'basic' });
  });

  it('falls back to defaultValue for a virtual field without a computed read', () => {
    const v = field({ id: 'v', key: 'mode', kind: 'virtual', defaultValue: 'manual' });
    expect(computeVirtualFieldValues(schema([v]), {})).toEqual({ mode: 'manual' });
  });

  it('ignores non-virtual fields', () => {
    const s = field({ id: 's', key: 's', defaultValue: 'x' });
    expect(computeVirtualFieldValues(schema([s]), {})).toEqual({});
  });
});
