import {
  type ConfigField,
  type ConfigGroup,
  type DatasourceConfigSchema,
  resolveGroups,
  resolveRequiredFieldsGroup,
  formKey,
  parseDependsOn,
} from './config';

// ============================================================
// Helpers
// ============================================================

function field(overrides: Partial<ConfigField> & { id: string }): ConfigField {
  return {
    key: overrides.id.split('.').pop() ?? overrides.id,
    valueType: 'string',
    ...overrides,
  } as ConfigField;
}

function schema(fields: ConfigField[], groups?: ConfigGroup[]): DatasourceConfigSchema {
  return {
    schemaVersion: 'v1',
    pluginType: 'test-ds',
    pluginName: 'Test',
    fields,
    groups,
  };
}

// ============================================================
// resolveRequiredFieldsGroup
// ============================================================

describe('resolveRequiredFieldsGroup', () => {
  it('returns null when no required fields exist', () => {
    const s = schema([field({ id: 'a', target: 'jsonData' }), field({ id: 'b', target: 'jsonData' })]);
    expect(resolveRequiredFieldsGroup(s)).toBeNull();
  });

  it('returns null for an empty fields array', () => {
    const s = schema([]);
    expect(resolveRequiredFieldsGroup(s)).toBeNull();
  });

  it('includes fields with required: true', () => {
    const s = schema([
      field({ id: 'url', target: 'root', required: true }),
      field({ id: 'optional', target: 'jsonData' }),
    ]);
    const result = resolveRequiredFieldsGroup(s);
    expect(result).not.toBeNull();
    expect(result!.group.id).toBe('_required');
    expect(result!.group.title).toBe('Required');
    expect(result!.fields.map((f) => f.id)).toEqual(['url']);
  });

  it('includes parent fields that required fields depend on via dependsOn', () => {
    const s = schema([
      field({ id: 'auth.method', kind: 'virtual', valueType: 'string' }),
      field({
        id: 'basicAuthUser',
        target: 'root',
        required: true,
        dependsOn: "auth.method == 'basic-auth'",
      }),
    ]);
    const result = resolveRequiredFieldsGroup(s);
    expect(result).not.toBeNull();
    const ids = result!.fields.map((f) => f.id);
    expect(ids).toContain('auth.method');
    expect(ids).toContain('basicAuthUser');
  });

  it('includes child fields that depend on required fields', () => {
    const s = schema([
      field({ id: 'protocol', target: 'jsonData', required: true }),
      field({
        id: 'path',
        target: 'jsonData',
        dependsOn: "protocol == 'http'",
      }),
    ]);
    const result = resolveRequiredFieldsGroup(s);
    expect(result).not.toBeNull();
    const ids = result!.fields.map((f) => f.id);
    expect(ids).toContain('protocol');
    expect(ids).toContain('path');
  });

  it('includes all fields from the "auth" group', () => {
    const authMethod = field({ id: 'auth.method', kind: 'virtual', valueType: 'string' });
    const basicUser = field({ id: 'root.basicAuthUser', target: 'root' });
    const password = field({ id: 'secureJsonData.basicAuthPassword', target: 'secureJsonData' });
    const unrelated = field({ id: 'other', target: 'jsonData' });

    const s = schema(
      [authMethod, basicUser, password, unrelated],
      [
        {
          id: 'auth',
          title: 'Authentication',
          fieldRefs: ['auth.method', 'root.basicAuthUser', 'secureJsonData.basicAuthPassword'],
        },
        { id: 'other', title: 'Other', fieldRefs: ['other'] },
      ]
    );
    const result = resolveRequiredFieldsGroup(s);
    expect(result).not.toBeNull();
    const ids = result!.fields.map((f) => f.id);
    expect(ids).toContain('auth.method');
    expect(ids).toContain('root.basicAuthUser');
    expect(ids).toContain('secureJsonData.basicAuthPassword');
    expect(ids).not.toContain('other');
  });

  it('preserves schema field order and deduplicates', () => {
    const s = schema(
      [
        field({ id: 'url', target: 'root', required: true }),
        field({ id: 'auth.method', kind: 'virtual', valueType: 'string' }),
        field({ id: 'user', target: 'root', dependsOn: "auth.method == 'basic'" }),
      ],
      [{ id: 'auth', title: 'Auth', fieldRefs: ['auth.method', 'user'] }]
    );
    const result = resolveRequiredFieldsGroup(s);
    expect(result).not.toBeNull();
    const ids = result!.fields.map((f) => f.id);
    // Schema order: url, auth.method, user — each appears once
    expect(ids).toEqual(['url', 'auth.method', 'user']);
  });
});

// ============================================================
// resolveGroups
// ============================================================

describe('resolveGroups', () => {
  it('returns a single default group when schema has no groups', () => {
    const s = schema([field({ id: 'a', target: 'jsonData' }), field({ id: 'b', target: 'jsonData' })]);
    const groups = resolveGroups(s);
    expect(groups).toHaveLength(1);
    expect(groups[0].group.id).toBe('default');
    expect(groups[0].fields.map((f) => f.id)).toEqual(['a', 'b']);
  });

  it('resolves schema groups with correct fields', () => {
    const s = schema(
      [field({ id: 'url', target: 'root' }), field({ id: 'timeout', target: 'jsonData' })],
      [
        { id: 'conn', title: 'Connection', fieldRefs: ['url'] },
        { id: 'perf', title: 'Performance', fieldRefs: ['timeout'] },
      ]
    );
    const groups = resolveGroups(s);
    expect(groups).toHaveLength(2);
    expect(groups[0].group.title).toBe('Connection');
    expect(groups[0].fields.map((f) => f.id)).toEqual(['url']);
    expect(groups[1].group.title).toBe('Performance');
  });

  it('sorts groups by order field', () => {
    const s = schema(
      [field({ id: 'a', target: 'jsonData' }), field({ id: 'b', target: 'jsonData' })],
      [
        { id: 'second', title: 'Second', order: 2, fieldRefs: ['b'] },
        { id: 'first', title: 'First', order: 1, fieldRefs: ['a'] },
      ]
    );
    const groups = resolveGroups(s);
    expect(groups[0].group.title).toBe('First');
    expect(groups[1].group.title).toBe('Second');
  });
});

// ============================================================
// resolveGroups + resolveRequiredFieldsGroup integration
// ============================================================

describe('resolveGroups + required group integration', () => {
  it('prepends _required group before schema groups', () => {
    const s = schema(
      [field({ id: 'url', target: 'root', required: true }), field({ id: 'timeout', target: 'jsonData' })],
      [
        { id: 'conn', title: 'Connection', fieldRefs: ['url'] },
        { id: 'perf', title: 'Performance', fieldRefs: ['timeout'] },
      ]
    );
    const groups = resolveGroups(s);
    const requiredGroup = resolveRequiredFieldsGroup(s);
    expect(requiredGroup).not.toBeNull();
    const combined = [requiredGroup!, ...groups];
    expect(combined[0].group.id).toBe('_required');
    expect(combined[1].group.id).toBe('conn');
    expect(combined[2].group.id).toBe('perf');
  });

  it('all original groups remain in the list (no filtering at this level)', () => {
    const s = schema(
      [field({ id: 'url', target: 'root', required: true })],
      [{ id: 'conn', title: 'Connection', fieldRefs: ['url'] }]
    );
    const groups = resolveGroups(s);
    const requiredGroup = resolveRequiredFieldsGroup(s);
    const combined = [requiredGroup!, ...groups];
    // Both _required and conn present, even though conn is fully redundant
    expect(combined).toHaveLength(2);
    expect(combined.map((g) => g.group.id)).toEqual(['_required', 'conn']);
  });
});

// ============================================================
// arrowSteps computation (unit-tested as pure logic)
// ============================================================

describe('arrowSteps computation', () => {
  function computeArrowSteps(resolvedGroups: Array<{ group: ConfigGroup; fields: ConfigField[] }>): Set<number> {
    const requiredGroup = resolvedGroups.find((g) => g.group.id === '_required');
    if (!requiredGroup) {
      return new Set(resolvedGroups.map((_, i) => i));
    }
    const requiredFieldIds = new Set(requiredGroup.fields.map((f) => f.id));
    const steps = new Set<number>();
    for (let i = 0; i < resolvedGroups.length; i++) {
      const g = resolvedGroups[i];
      if (g.group.id === '_required' || g.fields.some((f) => !requiredFieldIds.has(f.id))) {
        steps.add(i);
      }
    }
    return steps;
  }

  it('includes the _required group index', () => {
    const url = field({ id: 'url', target: 'root', required: true });
    const groups = [
      { group: { id: '_required', title: 'Required', fieldRefs: ['url'] }, fields: [url] },
      { group: { id: 'conn', title: 'Connection', fieldRefs: ['url'] }, fields: [url] },
    ];
    const steps = computeArrowSteps(groups);
    expect(steps.has(0)).toBe(true);
  });

  it('skips groups whose fields are all in the required group', () => {
    const url = field({ id: 'url', target: 'root', required: true });
    const groups = [
      { group: { id: '_required', title: 'Required', fieldRefs: ['url'] }, fields: [url] },
      { group: { id: 'conn', title: 'Connection', fieldRefs: ['url'] }, fields: [url] },
    ];
    const steps = computeArrowSteps(groups);
    expect(steps.has(1)).toBe(false);
  });

  it('includes groups with at least one non-required field', () => {
    const url = field({ id: 'url', target: 'root', required: true });
    const timeout = field({ id: 'timeout', target: 'jsonData' });
    const groups = [
      { group: { id: '_required', title: 'Required', fieldRefs: ['url'] }, fields: [url] },
      { group: { id: 'conn', title: 'Connection', fieldRefs: ['url'] }, fields: [url] },
      { group: { id: 'perf', title: 'Performance', fieldRefs: ['timeout'] }, fields: [timeout] },
    ];
    const steps = computeArrowSteps(groups);
    expect(steps.has(0)).toBe(true); // _required
    expect(steps.has(1)).toBe(false); // conn — fully redundant
    expect(steps.has(2)).toBe(true); // perf — unique field
  });

  it('includes all indices when no required group exists', () => {
    const a = field({ id: 'a', target: 'jsonData' });
    const b = field({ id: 'b', target: 'jsonData' });
    const groups = [
      { group: { id: 'g1', title: 'G1', fieldRefs: ['a'] }, fields: [a] },
      { group: { id: 'g2', title: 'G2', fieldRefs: ['b'] }, fields: [b] },
    ];
    const steps = computeArrowSteps(groups);
    expect(steps).toEqual(new Set([0, 1]));
  });
});

// ============================================================
// formKey
// ============================================================

describe('formKey', () => {
  it('returns key for non-sectioned fields', () => {
    expect(formKey(field({ id: 'host', key: 'host' }))).toBe('host');
  });

  it('prefixes with section for sectioned fields', () => {
    expect(formKey(field({ id: 'logs.db', key: 'defaultDatabase', section: 'logs' }))).toBe('logs.defaultDatabase');
  });
});

// ============================================================
// parseDependsOn
// ============================================================

describe('parseDependsOn', () => {
  it('parses simple equality', () => {
    expect(parseDependsOn("protocol == 'http'")).toEqual({ field: 'protocol', value: 'http' });
  });

  it('parses boolean equality', () => {
    expect(parseDependsOn('tlsAuth == true')).toEqual({ field: 'tlsAuth', value: 'true' });
  });

  it('returns null for invalid expressions', () => {
    expect(parseDependsOn('garbage')).toBeNull();
  });
});
