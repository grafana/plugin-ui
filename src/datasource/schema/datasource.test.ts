import type { ConfigField } from './schema';
import {
  resolveSecureKeyTemplate,
  findActiveSecureOverride,
  buildDatasourceConfigPayload,
  SECURE_FIELD_CONFIGURED,
} from './datasource';
import type { DatasourceResponse } from './types';

// ============================================================
// Helpers
// ============================================================

function itemField(overrides: Partial<ConfigField> & { id: string; key: string }): ConfigField {
  return {
    valueType: 'string',
    isItemField: true,
    ...overrides,
  } as ConfigField;
}

function arrayField(overrides: Partial<ConfigField> & { id: string; key: string }): ConfigField {
  return {
    valueType: 'array',
    target: 'jsonData',
    ...overrides,
  } as ConfigField;
}

// ============================================================
// resolveSecureKeyTemplate
// ============================================================

describe('resolveSecureKeyTemplate', () => {
  it('resolves {item.KEY} placeholders', () => {
    expect(resolveSecureKeyTemplate('secureHttpHeaders.{item.name}', { name: 'Authorization', secure: true }, 0)).toBe(
      'secureHttpHeaders.Authorization'
    );
  });

  it('resolves {index} placeholder (0-based)', () => {
    expect(resolveSecureKeyTemplate('header_{index}', { name: 'X-Test' }, 3)).toBe('header_3');
  });

  it('resolves {index1} placeholder (1-based)', () => {
    expect(resolveSecureKeyTemplate('httpHeaderValue{index1}', { name: 'X-Test' }, 0)).toBe('httpHeaderValue1');
    expect(resolveSecureKeyTemplate('httpHeaderValue{index1}', { name: 'X-Test' }, 2)).toBe('httpHeaderValue3');
  });

  it('resolves multiple placeholders in one template', () => {
    expect(resolveSecureKeyTemplate('prefix.{item.name}.{index}', { name: 'Auth' }, 5)).toBe('prefix.Auth.5');
  });

  it('handles missing item field gracefully', () => {
    expect(resolveSecureKeyTemplate('key.{item.missing}', {}, 0)).toBe('key.');
  });
});

// ============================================================
// findActiveSecureOverride
// ============================================================

describe('findActiveSecureOverride', () => {
  const fields = [
    itemField({ id: 'h.name', key: 'name' }),
    itemField({
      id: 'h.value',
      key: 'value',
      overrides: [{ when: 'item.secure == true', secureKey: 'secureHttpHeaders.{item.name}' }],
    }),
    itemField({ id: 'h.secure', key: 'secure', valueType: 'boolean' }),
  ];

  it('returns resolved key when condition matches', () => {
    const result = findActiveSecureOverride(fields, { name: 'Authorization', value: 'secret', secure: true }, 0);
    expect(result).toEqual({ fieldKey: 'value', resolvedKey: 'secureHttpHeaders.Authorization' });
  });

  it('returns null when condition does not match', () => {
    const result = findActiveSecureOverride(fields, { name: 'X-Public', value: 'plain', secure: false }, 0);
    expect(result).toBeNull();
  });

  it('returns null when no overrides have secureKey', () => {
    const noSecure = [
      itemField({ id: 'h.name', key: 'name' }),
      itemField({ id: 'h.value', key: 'value', overrides: [{ when: 'true', readOnly: true }] }),
    ];
    const result = findActiveSecureOverride(noSecure, { name: 'X' }, 0);
    expect(result).toBeNull();
  });

  it('handles unconditional secureKey (when: "true")', () => {
    const alwaysSecure = [
      itemField({ id: 'h.name', key: 'name' }),
      itemField({
        id: 'h.value',
        key: 'value',
        overrides: [{ when: 'true', secureKey: 'httpHeaderValue{index1}' }],
      }),
    ];
    const result = findActiveSecureOverride(alwaysSecure, { name: 'X-Test' }, 2);
    expect(result).toEqual({ fieldKey: 'value', resolvedKey: 'httpHeaderValue3' });
  });
});

// ============================================================
// buildDatasourceConfigPayload — secureKey write path
// ============================================================

describe('buildDatasourceConfigPayload secureKey', () => {
  const httpHeadersField = arrayField({
    id: 'jsonData.httpHeaders',
    key: 'httpHeaders',
    item: {
      valueType: 'object',
      fields: [
        itemField({ id: 'httpHeaders.item.name', key: 'name' }),
        itemField({
          id: 'httpHeaders.item.value',
          key: 'value',
          overrides: [{ when: 'item.secure == true', secureKey: 'secureHttpHeaders.{item.name}' }],
        }),
        itemField({ id: 'httpHeaders.item.secure', key: 'secure', valueType: 'boolean' }),
      ],
    },
  });

  const existing: DatasourceResponse = {
    name: 'test',
    id: 1,
    uid: 'test-uid',
    jsonData: {},
    secureJsonFields: {},
  };

  const allVisible = () => true;

  it('routes secure item values to secureJsonData and clears inline value', () => {
    const data = {
      httpHeaders: [
        { name: 'X-Public', value: 'plain-value', secure: false },
        { name: 'Authorization', value: 'secret123', secure: true },
      ],
    };

    const result = buildDatasourceConfigPayload(data, [httpHeadersField], existing, allVisible);

    // The secure header value should be in secureJsonData
    expect(result.secureJsonData['secureHttpHeaders.Authorization']).toBe('secret123');
    // The inline value should be cleared
    const headers = result.jsonData.httpHeaders as Array<Record<string, unknown>>;
    expect(headers[1].value).toBe('');
    // The plain header should remain untouched
    expect(headers[0].value).toBe('plain-value');
  });

  it('preserves already-configured secure values', () => {
    const data = {
      httpHeaders: [{ name: 'Authorization', value: SECURE_FIELD_CONFIGURED, secure: true }],
    };

    const result = buildDatasourceConfigPayload(data, [httpHeadersField], existing, allVisible);

    expect(result.secureJsonFields['secureHttpHeaders.Authorization']).toBe(true);
    expect(result.secureJsonData['secureHttpHeaders.Authorization']).toBeUndefined();
  });

  it('cleans up stale secure keys when headers are removed', () => {
    const existingWithStale: DatasourceResponse = {
      ...existing,
      secureJsonFields: {
        'secureHttpHeaders.OldHeader': true,
        'secureHttpHeaders.Authorization': true,
      },
    };

    const data = {
      httpHeaders: [{ name: 'Authorization', value: SECURE_FIELD_CONFIGURED, secure: true }],
    };

    const result = buildDatasourceConfigPayload(data, [httpHeadersField], existingWithStale, allVisible);

    // Authorization should be preserved
    expect(result.secureJsonFields['secureHttpHeaders.Authorization']).toBe(true);
    // OldHeader should be cleaned up
    expect(result.secureJsonFields['secureHttpHeaders.OldHeader']).toBe(false);
    expect(result.secureJsonData['secureHttpHeaders.OldHeader']).toBe('');
  });

  it('does not touch unrelated secureJsonFields', () => {
    const existingWithOther: DatasourceResponse = {
      ...existing,
      secureJsonFields: {
        password: true,
        tlsCACert: true,
      },
    };

    const data = {
      httpHeaders: [{ name: 'X-Public', value: 'plain', secure: false }],
    };

    const result = buildDatasourceConfigPayload(data, [httpHeadersField], existingWithOther, allVisible);

    // Unrelated secure fields should remain untouched
    expect(result.secureJsonFields.password).toBe(true);
    expect(result.secureJsonFields.tlsCACert).toBe(true);
  });

  it('works with index-based secureKey templates', () => {
    const indexedField = arrayField({
      id: 'jsonData.headers',
      key: 'headers',
      item: {
        valueType: 'object',
        fields: [
          itemField({ id: 'headers.item.name', key: 'name' }),
          itemField({
            id: 'headers.item.value',
            key: 'value',
            overrides: [{ when: 'true', secureKey: 'httpHeaderValue{index1}' }],
          }),
        ],
      },
    });

    const data = {
      headers: [
        { name: 'X-First', value: 'val1' },
        { name: 'X-Second', value: 'val2' },
      ],
    };

    const result = buildDatasourceConfigPayload(data, [indexedField], existing, allVisible);

    expect(result.secureJsonData['httpHeaderValue1']).toBe('val1');
    expect(result.secureJsonData['httpHeaderValue2']).toBe('val2');
    // Inline values should be cleared
    const headers = result.jsonData.headers as Array<Record<string, unknown>>;
    expect(headers[0].value).toBe('');
    expect(headers[1].value).toBe('');
  });
});
