// @ts-expect-error — js-yaml has no bundled type declarations
import yaml from 'js-yaml';
import type { ConfigField, DatasourceConfigSchema } from '../schema';
import { datasourceToProvisioningYaml, formatYamlDiff, generateProvisioningTemplate } from './provisioning';

/** Build a ConfigField fixture with only the properties a test cares about. */
const field = (props: Pick<ConfigField, 'id' | 'key' | 'valueType'> & Partial<ConfigField>): ConfigField => props;

const makeSchema = (fields: ConfigField[], pluginType = 'acme'): DatasourceConfigSchema => ({
  schemaVersion: 'v1',
  pluginType,
  pluginName: 'grafana-dsconfig-datasource',
  fields,
});

type ParsedDatasource = {
  name: string;
  type: string;
  uid?: string;
  url?: string;
  jsonData?: Record<string, unknown>;
  secureJsonData?: Record<string, unknown>;
  [key: string]: unknown;
};

/** Parse generated YAML and return the first datasource entry. Also asserts the output is valid YAML. */
const parseDatasource = (out: string): ParsedDatasource => {
  const doc = yaml.load(out) as { apiVersion: number; datasources: ParsedDatasource[] };
  return doc.datasources[0];
};

describe('generateProvisioningTemplate', () => {
  it('emits a valid provisioning document with apiVersion, default name, and type', () => {
    const out = generateProvisioningTemplate(
      makeSchema([
        field({ id: 'url', key: 'url', valueType: 'string', target: 'root', defaultValue: 'http://localhost' }),
      ])
    );
    const doc = yaml.load(out) as { apiVersion: number; datasources: ParsedDatasource[] };

    expect(doc.apiVersion).toBe(1);
    expect(doc.datasources).toHaveLength(1);
    expect(doc.datasources[0]).toMatchObject({ name: 'my-acme', type: 'acme', url: 'http://localhost' });
  });

  it('emits only the header when the schema has no storage fields', () => {
    const out = generateProvisioningTemplate(makeSchema([]));
    expect(out).toBe('apiVersion: 1\n\ndatasources:\n  - name: my-acme\n    type: acme');
  });

  it('uses options.name to override the datasource name', () => {
    const out = generateProvisioningTemplate(makeSchema([]), { name: 'prod-acme' });
    expect(parseDatasource(out).name).toBe('prod-acme');
  });

  it('does not re-emit name, type, or uid as root fields', () => {
    const out = generateProvisioningTemplate(
      makeSchema([
        field({ id: 'name', key: 'name', valueType: 'string', target: 'root' }),
        field({ id: 'uid', key: 'uid', valueType: 'string', target: 'root' }),
        field({ id: 'url', key: 'url', valueType: 'string', target: 'root', defaultValue: 'http://x' }),
      ])
    );
    // name appears once (in the header), type once, uid never
    expect(out.match(/name:/g)).toHaveLength(1);
    expect(out).not.toContain('uid:');
  });

  describe('comments', () => {
    it('includes label, required marker, and description by default', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 'j.timeout',
            key: 'timeout',
            valueType: 'number',
            target: 'jsonData',
            label: 'Timeout',
            description: 'Request timeout',
            required: true,
            defaultValue: 30,
          }),
        ])
      );
      expect(out).toContain('# Timeout (REQUIRED) — Request timeout');
    });

    it('omits comments when options.comments is false', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 'j.timeout',
            key: 'timeout',
            valueType: 'number',
            target: 'jsonData',
            label: 'Timeout',
            defaultValue: 30,
          }),
        ]),
        { comments: false }
      );
      expect(out).not.toContain('#');
      expect(out).toContain('timeout: 30');
    });

    it('lists allowed values from ui.options', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 'j.mode',
            key: 'mode',
            valueType: 'string',
            target: 'jsonData',
            ui: {
              component: 'select',
              options: [
                { value: 'a', label: 'A' },
                { value: 'b', label: 'B' },
              ],
            },
          }),
        ])
      );
      expect(out).toContain('# Allowed values: a, b');
    });

    it('lists allowed values from an allowedValues validation rule', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 'j.level',
            key: 'level',
            valueType: 'number',
            target: 'jsonData',
            defaultValue: 1,
            validations: [{ type: 'allowedValues', values: [1, 2, 3] }],
          }),
        ])
      );
      expect(out).toContain('# Allowed values: 1, 2, 3');
    });

    it('notes conditional visibility via dependsOn', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 'j.tls',
            key: 'tlsCa',
            valueType: 'string',
            target: 'jsonData',
            defaultValue: '',
            dependsOn: "tls == 'enabled'",
          }),
        ])
      );
      expect(out).toContain("# Only when: tls == 'enabled'");
    });
  });

  describe('default values (template mode)', () => {
    it('uses the first ui option when a field has no defaultValue', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 'j.mode',
            key: 'mode',
            valueType: 'string',
            target: 'jsonData',
            ui: {
              component: 'select',
              options: [
                { value: 'first', label: 'First' },
                { value: 'second', label: 'Second' },
              ],
            },
          }),
        ]),
        { comments: false }
      );
      expect(parseDatasource(out).jsonData).toEqual({ mode: 'first' });
    });

    it('falls back to type-appropriate zero values', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({ id: 'j.s', key: 's', valueType: 'string', target: 'jsonData' }),
          field({ id: 'j.n', key: 'n', valueType: 'number', target: 'jsonData' }),
          field({ id: 'j.b', key: 'b', valueType: 'boolean', target: 'jsonData' }),
          field({ id: 'j.a', key: 'a', valueType: 'array', target: 'jsonData' }),
          field({ id: 'j.o', key: 'o', valueType: 'object', target: 'jsonData' }),
        ]),
        { comments: false }
      );
      expect(parseDatasource(out).jsonData).toEqual({ s: '', n: 0, b: false, a: [], o: {} });
    });
  });

  describe('secureJsonData placeholders', () => {
    it('emits an inline placeholder for single-line secrets', () => {
      const out = generateProvisioningTemplate(
        makeSchema([field({ id: 's.key', key: 'apiKey', valueType: 'string', target: 'secureJsonData' })]),
        { comments: false }
      );
      expect(out).toContain('apiKey: xxxxxx');
    });

    it('emits a correctly-indented block scalar for textarea/multiline secrets (regression: was invalid YAML)', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 's.ta',
            key: 'cert',
            valueType: 'string',
            target: 'secureJsonData',
            ui: { component: 'textarea' },
          }),
          field({
            id: 's.ml',
            key: 'pem',
            valueType: 'string',
            target: 'secureJsonData',
            ui: { component: 'input', multiline: true },
          }),
        ]),
        { comments: false }
      );

      // Key sits at 6 spaces (INDENT_NESTED); block content must be deeper (8 spaces) to be valid YAML.
      expect(out).toContain('cert: |\n        xxxxxx');
      expect(out).toContain('pem: |\n        xxxxxx');
      // and the whole document must parse
      expect(() => yaml.load(out)).not.toThrow();
    });
  });

  describe('field filtering', () => {
    it('excludes virtual, item, indexedPair, and managed-by (non-root) fields', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({ id: 'v', key: 'virtualField', valueType: 'string', target: 'jsonData', kind: 'virtual' }),
          field({ id: 'i', key: 'itemField', valueType: 'string', target: 'jsonData', isItemField: true }),
          field({
            id: 'h',
            key: 'httpHeaderName',
            valueType: 'string',
            target: 'jsonData',
            storage: {
              type: 'indexedPair',
              key: { target: 'jsonData', pattern: 'httpHeaderName{n}' },
              value: { target: 'secureJsonData', pattern: 'httpHeaderValue{n}' },
            },
          }),
          field({ id: 'm', key: 'managedField', valueType: 'string', target: 'jsonData', tags: ['managed-by:wizard'] }),
          field({ id: 'keep', key: 'keptField', valueType: 'string', target: 'jsonData', defaultValue: 'yes' }),
        ]),
        { comments: false }
      );
      expect(parseDatasource(out).jsonData).toEqual({ keptField: 'yes' });
    });

    it('keeps managed-by fields that live at the root', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({
            id: 'a',
            key: 'access',
            valueType: 'string',
            target: 'root',
            defaultValue: 'proxy',
            tags: ['managed-by:wizard'],
          }),
        ]),
        { comments: false }
      );
      expect(parseDatasource(out).access).toBe('proxy');
    });

    it('preserves schema field order in the jsonData section', () => {
      const out = generateProvisioningTemplate(
        makeSchema([
          field({ id: 'j.z', key: 'zebra', valueType: 'string', target: 'jsonData', defaultValue: '1' }),
          field({ id: 'j.a', key: 'apple', valueType: 'string', target: 'jsonData', defaultValue: '2' }),
          field({ id: 'j.m', key: 'mango', valueType: 'string', target: 'jsonData', defaultValue: '3' }),
        ]),
        { comments: false }
      );
      expect(Object.keys(parseDatasource(out).jsonData ?? {})).toEqual(['zebra', 'apple', 'mango']);
    });
  });

  it('serializes nested objects and arrays as valid, round-trippable YAML', () => {
    const out = generateProvisioningTemplate(
      makeSchema([
        field({
          id: 'j.o',
          key: 'obj',
          valueType: 'object',
          target: 'jsonData',
          defaultValue: { a: 1, b: { c: ['x', 'y'] } },
        }),
        field({
          id: 'j.a',
          key: 'arr',
          valueType: 'array',
          target: 'jsonData',
          defaultValue: [{ n: 'p', v: 1 }, 'loose'],
        }),
        field({
          id: 'j.s',
          key: 'tricky',
          valueType: 'string',
          target: 'jsonData',
          defaultValue: 'k: v # not a comment',
        }),
      ]),
      { comments: false }
    );
    const jsonData = parseDatasource(out).jsonData ?? {};

    expect(jsonData.obj).toEqual({ a: 1, b: { c: ['x', 'y'] } });
    expect(jsonData.arr).toEqual([{ n: 'p', v: 1 }, 'loose']);
    expect(jsonData.tricky).toBe('k: v # not a comment');
  });
});

describe('datasourceToProvisioningYaml (with schema — export mode)', () => {
  it('emits only values that are set and omits schema defaults', () => {
    const schema = makeSchema([
      field({ id: 'j.timeout', key: 'timeout', valueType: 'number', target: 'jsonData', defaultValue: 30 }),
      field({ id: 'j.path', key: 'path', valueType: 'string', target: 'jsonData' }),
    ]);
    const out = datasourceToProvisioningYaml({ name: 'x', jsonData: { timeout: 30, path: '/api' } }, schema);

    // timeout equals its default and is omitted; path is kept
    expect(parseDatasource(out).jsonData).toEqual({ path: '/api' });
  });

  it('emits uid for idempotent upserts', () => {
    const out = datasourceToProvisioningYaml({ name: 'x', uid: 'abc123' }, makeSchema([]));
    expect(parseDatasource(out).uid).toBe('abc123');
  });

  it('skips false booleans and empty root values', () => {
    const schema = makeSchema([
      field({ id: 'ba', key: 'basicAuth', valueType: 'boolean', target: 'root' }),
      field({ id: 'db', key: 'database', valueType: 'string', target: 'root' }),
      field({ id: 'url', key: 'url', valueType: 'string', target: 'root' }),
    ]);
    const out = datasourceToProvisioningYaml({ name: 'x', basicAuth: false, database: null, url: 'http://x' }, schema);
    const ds = parseDatasource(out);

    expect(ds.basicAuth).toBeUndefined();
    expect(ds.database).toBeUndefined();
    expect(ds.url).toBe('http://x');
  });

  it('emits extra jsonData keys that are not declared in the schema', () => {
    const schema = makeSchema([field({ id: 'j.a', key: 'declared', valueType: 'string', target: 'jsonData' })]);
    const out = datasourceToProvisioningYaml({ name: 'x', jsonData: { declared: 'a', extra: 'b' } }, schema);

    expect(parseDatasource(out).jsonData).toEqual({ declared: 'a', extra: 'b' });
  });

  it('emits only configured secrets and infers indexed header values', () => {
    const schema = makeSchema([
      field({ id: 's.k', key: 'apiKey', valueType: 'string', target: 'secureJsonData' }),
      field({ id: 's.p', key: 'password', valueType: 'string', target: 'secureJsonData' }),
    ]);
    const out = datasourceToProvisioningYaml(
      {
        name: 'x',
        jsonData: { httpHeaderName1: 'Authorization' },
        secureJsonFields: { apiKey: true, password: false },
      },
      schema
    );
    const secureJsonData = parseDatasource(out).secureJsonData ?? {};

    expect(secureJsonData.apiKey).toBe('xxxxxx'); // configured
    expect(secureJsonData.password).toBeUndefined(); // not configured
    expect(secureJsonData.httpHeaderValue1).toBe('xxxxxx'); // inferred from httpHeaderName1
  });

  it('falls back to my-<pluginType> when the datasource has no name', () => {
    const out = datasourceToProvisioningYaml({ url: 'http://x' }, makeSchema([], 'grafana-acme'));
    expect(parseDatasource(out).name).toBe('my-grafana-acme');
  });
});

describe('datasourceToProvisioningYaml (no schema — raw fallback)', () => {
  it('emits basic YAML from a raw datasource API response', () => {
    const out = datasourceToProvisioningYaml(
      {
        name: 'raw',
        uid: 'u1',
        type: 'acme',
        url: 'http://x',
        database: 'd',
        isDefault: true,
        basicAuth: true,
        basicAuthUser: 'admin',
        jsonData: { foo: 'bar', nested: { a: 1 } },
      },
      null
    );
    const ds = parseDatasource(out);

    expect(ds).toMatchObject({
      name: 'raw',
      uid: 'u1',
      type: 'acme',
      url: 'http://x',
      database: 'd',
      isDefault: true,
      basicAuth: true,
      basicAuthUser: 'admin',
    });
    expect(ds.jsonData).toEqual({ foo: 'bar', nested: { a: 1 } });
  });

  it('includes a commented secureJsonData placeholder because secrets are not exported', () => {
    const out = datasourceToProvisioningYaml({ name: 'raw', type: 'acme' }, null);
    expect(out).toContain('# secureJsonData: (secrets are not exported — add manually)');
  });

  it('omits optional root fields that are absent', () => {
    const out = datasourceToProvisioningYaml({ name: 'raw', type: 'acme' }, null);
    expect(out).not.toContain('url:');
    expect(out).not.toContain('basicAuth:');
    expect(out).not.toContain('database:');
  });
});

describe('formatYamlDiff', () => {
  it('wraps the diff in a ```diff fenced block', () => {
    const diff = formatYamlDiff({ url: 'http://a' }, { url: 'http://a' });
    expect(diff.startsWith('```diff\n')).toBe(true);
    expect(diff.endsWith('\n```')).toBe(true);
  });

  it('marks changed lines with - (removed) and + (added)', () => {
    const diff = formatYamlDiff({ url: 'http://a' }, { url: 'http://b' });
    expect(diff).toContain('-url: http://a');
    expect(diff).toContain('+url: http://b');
  });

  it('prefixes unchanged lines with a leading space', () => {
    const diff = formatYamlDiff({ url: 'http://a' }, { url: 'http://b' });
    // name is unset in both -> unchanged empty-string line
    expect(diff).toContain("\n name: ''");
  });

  it('masks secret values as ********', () => {
    const diff = formatYamlDiff({ secureJsonData: { token: 'old' } }, { secureJsonData: { token: 'new' } });
    expect(diff).toContain('********');
    expect(diff).not.toContain('old');
    expect(diff).not.toContain('new');
  });

  it('includes jsonData keys from both sides in sorted order', () => {
    const diff = formatYamlDiff({ jsonData: { zebra: 1 } }, { jsonData: { apple: 2 } });
    const appleIndex = diff.indexOf('apple:');
    const zebraIndex = diff.indexOf('zebra:');
    expect(appleIndex).toBeGreaterThan(-1);
    expect(zebraIndex).toBeGreaterThan(-1);
    expect(appleIndex).toBeLessThan(zebraIndex);
  });
});
