/**
 * Tests for Loki schema field visibility, groups, and conditional fields.
 *
 * Validates that the correct fields render for each configuration variant
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import lokiSchemaJson from '../../../../schema/registry/loki.schema.json';

const schema = lokiSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Helpers
// ============================================================

function buildFieldMap(): Map<string, ConfigField> {
  const m = new Map<string, ConfigField>();
  for (const f of schema.fields) {
    m.set(f.id, f);
  }
  return m;
}

function buildCelContext(values: Record<string, unknown>): Record<string, unknown> {
  const ctx: Record<string, unknown> = {};
  const fieldById = buildFieldMap();
  for (const f of fieldById.values()) {
    const fk = formKey(f);
    const val = getWatchedValue(values, fk);
    if (val !== undefined) {
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

function isVisible(field: ConfigField, values: Record<string, unknown>): boolean {
  if (field.kind === 'virtual' && !field.ui) {
    return false;
  }
  if (field.tags?.some((t) => t.startsWith('managed-by:'))) {
    return false;
  }
  if (!field.dependsOn) {
    return true;
  }
  const celCtx = buildCelContext(values);
  return evaluateCelExpression(field.dependsOn, celCtx);
}

function visibleFieldIds(values: Record<string, unknown>): string[] {
  return schema.fields.filter((f) => isVisible(f, values)).map((f) => f.id);
}

// ============================================================
// Schema structure
// ============================================================

describe('Loki schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(21);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth', 'http-network', 'alerting', 'queries', 'derived-fields']);
  });

  it('connection group has url', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('root.url');
  });

  it('auth group has method, user, and password', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('auth.method');
    expect(auth.group.fieldRefs).toContain('root.basicAuthUser');
    expect(auth.group.fieldRefs).toContain('secureJsonData.basicAuthPassword');
  });

  it('queries group has maxLines', () => {
    const groups = resolveGroups(schema);
    const queries = groups.find((g) => g.group.id === 'queries')!;
    expect(queries.group.fieldRefs).toContain('jsonData.maxLines');
  });

  it('alerting group has manageAlerts', () => {
    const groups = resolveGroups(schema);
    const alerting = groups.find((g) => g.group.id === 'alerting')!;
    expect(alerting.group.fieldRefs).toContain('jsonData.manageAlerts');
  });

  it('derived-fields group has derivedFields', () => {
    const groups = resolveGroups(schema);
    const df = groups.find((g) => g.group.id === 'derived-fields')!;
    expect(df.group.fieldRefs).toContain('jsonData.derivedFields');
  });

  it('http-network group has TLS, headers, cookies, and timeout', () => {
    const groups = resolveGroups(schema);
    const http = groups.find((g) => g.group.id === 'http-network')!;
    expect(http.group.fieldRefs).toContain('jsonData.tlsAuth');
    expect(http.group.fieldRefs).toContain('httpHeaders');
    expect(http.group.fieldRefs).toContain('jsonData.keepCookies');
    expect(http.group.fieldRefs).toContain('jsonData.timeout');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Loki required fields', () => {
  it('URL is required', () => {
    const field = schema.fields.find((f) => f.id === 'root.url')!;
    expect(field.required).toBe(true);
  });
});

// ============================================================
// Default values
// ============================================================

describe('Loki default values', () => {
  it('maxLines defaults to 1000', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.maxLines')!;
    expect(field.defaultValue).toBe('1000');
  });

  it('manageAlerts defaults to true', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.manageAlerts')!;
    expect(field.defaultValue).toBe(true);
  });
});

// ============================================================
// Derived fields schema
// ============================================================

describe('Loki derived fields', () => {
  it('derivedFields is an array type', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.derivedFields')!;
    expect(field.valueType).toBe('array');
  });

  it('derivedFields items have expected sub-fields', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.derivedFields')!;
    const subFieldKeys = field.item?.fields?.map((f) => f.key) ?? [];
    expect(subFieldKeys).toContain('name');
    expect(subFieldKeys).toContain('matcherRegex');
    expect(subFieldKeys).toContain('url');
    expect(subFieldKeys).toContain('datasourceUid');
    expect(subFieldKeys).toContain('matcherType');
    expect(subFieldKeys).toContain('targetBlank');
  });

  it('matcherType allows regex and label', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.derivedFields')!;
    const matcherType = field.item?.fields?.find((f) => f.key === 'matcherType');
    const rule = matcherType?.validations?.find((v) => v.type === 'allowedValues');
    expect(rule?.values).toEqual(['label', 'regex']);
  });
});

// ============================================================
// Conditional visibility
// ============================================================

describe('Loki conditional visibility', () => {
  it('basicAuthUser is hidden when auth method is no-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'no-auth' });
    expect(ids).not.toContain('root.basicAuthUser');
  });

  it('basicAuthUser is visible when auth method is basic-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'basic-auth' });
    expect(ids).toContain('root.basicAuthUser');
  });

  it('TLS client cert is hidden when tlsAuth is off', () => {
    const ids = visibleFieldIds({ tlsAuth: false });
    expect(ids).not.toContain('secureJsonData.tlsClientCert');
    expect(ids).not.toContain('secureJsonData.tlsClientKey');
  });

  it('TLS client cert is visible when tlsAuth is on', () => {
    const ids = visibleFieldIds({ tlsAuth: true });
    expect(ids).toContain('secureJsonData.tlsClientCert');
    expect(ids).toContain('secureJsonData.tlsClientKey');
  });

  it('CA cert is visible when tlsAuthWithCACert is on', () => {
    const ids = visibleFieldIds({ tlsAuthWithCACert: true });
    expect(ids).toContain('secureJsonData.tlsCACert');
  });

  it('TLS server name is hidden when tlsAuth is off', () => {
    const ids = visibleFieldIds({ tlsAuth: false });
    expect(ids).not.toContain('jsonData.serverName');
  });

  it('TLS server name is visible when tlsAuth is on', () => {
    const ids = visibleFieldIds({ tlsAuth: true });
    expect(ids).toContain('jsonData.serverName');
  });
});
