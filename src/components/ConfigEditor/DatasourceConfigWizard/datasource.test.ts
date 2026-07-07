import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import type { ConfigField } from '../../../schema/schema';
import {
  SECURE_FIELD_CONFIGURED,
  resolveSecureKeyTemplate,
  findActiveSecureOverride,
  expandIndexedPair,
  flattenIndexedPair,
  buildDatasourceConfigPayload,
  fetchExistingValues,
  type DatasourceResponse,
} from './datasource';

const field = (partial: Partial<ConfigField> & { id: string; key: string }): ConfigField => ({
  valueType: 'string',
  ...partial,
});

const ds = (partial: Partial<DatasourceResponse> = {}): DatasourceResponse => ({
  name: 'test-ds',
  id: 1,
  uid: 'test-uid',
  ...partial,
});

// A loki-style indexedPair headers field: name -> jsonData, value -> secureJsonData.
const headersField = (): ConfigField =>
  field({
    id: 'jsonData_httpHeaders',
    key: 'httpHeaders',
    valueType: 'array',
    target: 'jsonData',
    item: { valueType: 'object', fields: [] },
    storage: {
      type: 'indexedPair',
      key: { target: 'jsonData', pattern: 'httpHeaderName{index}' },
      value: { target: 'secureJsonData', pattern: 'httpHeaderValue{index}' },
      startIndex: 1,
    },
  });

describe('resolveSecureKeyTemplate', () => {
  it('substitutes {item.KEY} from the item', () => {
    expect(resolveSecureKeyTemplate('secureHttpHeaders.{item.name}', { name: 'X-Api-Key' }, 0)).toBe(
      'secureHttpHeaders.X-Api-Key'
    );
  });

  it('substitutes 1-based {index1}', () => {
    expect(resolveSecureKeyTemplate('httpHeaderValue{index1}', {}, 0)).toBe('httpHeaderValue1');
  });

  it('substitutes 0-based {index}', () => {
    expect(resolveSecureKeyTemplate('v{index}', {}, 3)).toBe('v3');
  });

  it('renders a missing item key as an empty string', () => {
    expect(resolveSecureKeyTemplate('{item.missing}', {}, 0)).toBe('');
  });
});

describe('findActiveSecureOverride', () => {
  const nameField = field({ id: 'n', key: 'name', isItemField: true });
  const valueField = field({
    id: 'v',
    key: 'value',
    isItemField: true,
    overrides: [{ when: 'item.secure == true', secureKey: 'secureHttpHeaders.{item.name}' }],
  });
  const secureFlag = field({ id: 's', key: 'secure', valueType: 'boolean', isItemField: true });
  const itemFields = [nameField, valueField, secureFlag];

  it('returns the field key and resolved secure key when the condition matches', () => {
    expect(findActiveSecureOverride(itemFields, { name: 'X-A', value: 'v', secure: true }, 0)).toEqual({
      fieldKey: 'value',
      resolvedKey: 'secureHttpHeaders.X-A',
    });
  });

  it('returns null when the condition does not match', () => {
    expect(findActiveSecureOverride(itemFields, { name: 'X-A', value: 'v', secure: false }, 0)).toBeNull();
  });

  it('returns null when no item field declares a secureKey override', () => {
    expect(findActiveSecureOverride([nameField, secureFlag], { name: 'X-A', secure: true }, 0)).toBeNull();
  });

  it('supports a literal "true" condition', () => {
    const always = field({
      id: 'v',
      key: 'value',
      isItemField: true,
      overrides: [{ when: 'true', secureKey: 'k{index1}' }],
    });
    expect(findActiveSecureOverride([always], { value: 'v' }, 4)).toEqual({ fieldKey: 'value', resolvedKey: 'k5' });
  });
});

describe('expandIndexedPair', () => {
  it('expands indexed keys into items, marking configured secrets', () => {
    const result = expandIndexedPair(
      headersField(),
      ds({ jsonData: { httpHeaderName1: 'X-A', httpHeaderName2: 'X-B' }, secureJsonFields: { httpHeaderValue1: true } })
    );
    expect(result).toEqual([
      { index: 1, name: 'X-A', value: SECURE_FIELD_CONFIGURED },
      { index: 2, name: 'X-B', value: '' },
    ]);
  });

  it('returns an empty array for a non-indexedPair field', () => {
    expect(expandIndexedPair(field({ id: 'a', key: 'a' }), ds())).toEqual([]);
  });

  it('skips indices whose name key is absent', () => {
    // Only httpHeaderValue3 present (no matching name) -> nothing to expand.
    expect(
      expandIndexedPair(headersField(), ds({ jsonData: {}, secureJsonFields: { httpHeaderValue3: true } }))
    ).toEqual([]);
  });
});

describe('flattenIndexedPair', () => {
  it('writes new items to sequential indices from startIndex', () => {
    const jsonData: Record<string, unknown> = {};
    const secureJsonData: Record<string, string> = {};
    const secureJsonFields: Record<string, boolean> = {};
    flattenIndexedPair(
      headersField(),
      [
        { index: 0, name: 'A', value: 'sa' },
        { index: 0, name: 'B', value: 'sb' },
      ],
      jsonData,
      secureJsonData,
      secureJsonFields
    );
    expect(jsonData).toEqual({ httpHeaderName1: 'A', httpHeaderName2: 'B' });
    expect(secureJsonData).toEqual({ httpHeaderValue1: 'sa', httpHeaderValue2: 'sb' });
    expect(secureJsonFields).toEqual({ httpHeaderValue1: false, httpHeaderValue2: false });
  });

  it('preserves already-configured secrets without rewriting them', () => {
    const jsonData: Record<string, unknown> = { httpHeaderName1: 'A' };
    const secureJsonData: Record<string, string> = {};
    const secureJsonFields: Record<string, boolean> = {};
    flattenIndexedPair(
      headersField(),
      [{ index: 1, name: 'A', value: SECURE_FIELD_CONFIGURED }],
      jsonData,
      secureJsonData,
      secureJsonFields
    );
    expect(secureJsonFields).toEqual({ httpHeaderValue1: true });
    expect(secureJsonData).toEqual({});
  });

  it('clears indices that existed before but are no longer present', () => {
    const jsonData: Record<string, unknown> = { httpHeaderName1: 'A', httpHeaderName2: 'STALE' };
    const secureJsonData: Record<string, string> = {};
    const secureJsonFields: Record<string, boolean> = {};
    flattenIndexedPair(
      headersField(),
      [{ index: 1, name: 'A', value: SECURE_FIELD_CONFIGURED }],
      jsonData,
      secureJsonData,
      secureJsonFields
    );
    expect(jsonData.httpHeaderName2).toBeUndefined();
    expect(secureJsonFields.httpHeaderValue2).toBeUndefined();
  });
});

describe('buildDatasourceConfigPayload', () => {
  const visible = () => true;

  it('routes fields to root, jsonData and secureJsonData by target', () => {
    const fields = [
      field({ id: 'url', key: 'url', target: 'root' }),
      field({ id: 'db', key: 'database', target: 'jsonData' }),
      field({ id: 'pw', key: 'password', target: 'secureJsonData' }),
    ];
    const payload = buildDatasourceConfigPayload(
      { url: 'http://x', database: 'mydb', password: 'secret' },
      fields,
      ds({ jsonData: {}, secureJsonFields: {} }),
      visible
    );
    expect(payload.rootFields).toEqual({ url: 'http://x' });
    expect(payload.jsonData).toEqual({ database: 'mydb' });
    expect(payload.secureJsonData).toEqual({ password: 'secret' });
    expect(payload.secureJsonFields).toEqual({ password: false });
  });

  it('keeps an already-configured secret as a secureJsonFields flag', () => {
    const fields = [field({ id: 'pw', key: 'password', target: 'secureJsonData' })];
    const payload = buildDatasourceConfigPayload({ password: SECURE_FIELD_CONFIGURED }, fields, ds(), visible);
    expect(payload.secureJsonData.password).toBeUndefined();
    expect(payload.secureJsonFields).toEqual({ password: true });
  });

  it('nests section-scoped jsonData fields under their section', () => {
    const fields = [field({ id: 't', key: 'defaultTable', target: 'jsonData', section: 'logs' })];
    const payload = buildDatasourceConfigPayload({ 'logs.defaultTable': 't1' }, fields, ds(), visible);
    expect(payload.jsonData).toEqual({ logs: { defaultTable: 't1' } });
  });

  it('skips fields that are not visible', () => {
    const fields = [field({ id: 'db', key: 'database', target: 'jsonData' })];
    const payload = buildDatasourceConfigPayload({ database: 'mydb' }, fields, ds({ jsonData: {} }), () => false);
    expect(payload.jsonData.database).toBeUndefined();
  });

  it('always includes fields managed by effects even when hidden', () => {
    const fields = [
      field({ id: 'ba', key: 'basicAuth', valueType: 'boolean', target: 'root', tags: ['managed-by:authMethod'] }),
    ];
    const payload = buildDatasourceConfigPayload({ basicAuth: true }, fields, ds(), () => false);
    expect(payload.rootFields).toEqual({ basicAuth: true });
  });
});

describe('fetchExistingValues', () => {
  const setBackend = (impl: { get: (...args: unknown[]) => Promise<unknown> }) =>
    setBackendSrv(impl as unknown as BackendSrv);

  it('maps root, jsonData, secure and indexedPair fields into form values', async () => {
    setBackend({
      get: async () =>
        ds({
          url: 'http://loki:3100',
          basicAuth: true,
          jsonData: { maxLines: '500', httpHeaderName1: 'X-A' },
          secureJsonFields: { basicAuthPassword: true, httpHeaderValue1: true },
        }),
    });
    const fields = [
      field({ id: 'url', key: 'url', target: 'root' }),
      field({ id: 'ba', key: 'basicAuth', valueType: 'boolean', target: 'root' }),
      field({ id: 'ml', key: 'maxLines', target: 'jsonData' }),
      field({ id: 'pw', key: 'basicAuthPassword', target: 'secureJsonData' }),
      headersField(),
    ];
    const result = await fetchExistingValues('uid', fields);
    expect(result.error).toBeUndefined();
    expect(result.values.url).toBe('http://loki:3100');
    expect(result.values.basicAuth).toBe(true);
    expect(result.values.maxLines).toBe('500');
    expect(result.values.basicAuthPassword).toBe(SECURE_FIELD_CONFIGURED);
    expect(result.values.httpHeaders).toEqual([{ index: 1, name: 'X-A', value: SECURE_FIELD_CONFIGURED }]);
  });

  it('reads section-scoped jsonData fields from the nested object', async () => {
    setBackend({ get: async () => ds({ jsonData: { logs: { defaultTable: 'events' } } }) });
    const fields = [field({ id: 't', key: 'defaultTable', target: 'jsonData', section: 'logs' })];
    const result = await fetchExistingValues('uid', fields);
    expect(result.values['logs.defaultTable']).toBe('events');
  });

  it('surfaces the readOnly flag', async () => {
    setBackend({ get: async () => ds({ readOnly: true }) });
    const result = await fetchExistingValues('uid', []);
    expect(result.readOnly).toBe(true);
  });

  it('returns an error message when the request fails', async () => {
    setBackend({
      get: async () => {
        throw new Error('boom');
      },
    });
    const result = await fetchExistingValues('uid', []);
    expect(result.error).toBe('boom');
    expect(result.values).toEqual({});
  });
});
