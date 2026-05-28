/**
 * Tests for Elasticsearch schema field visibility, groups, and conditional fields.
 *
 * Validates that the correct fields render for each configuration variant
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import schemaJson from '../../../../schema/registry/elasticsearch.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

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

describe('Elasticsearch schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(30);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth', 'tls', 'http', 'elasticsearch-details', 'logs', 'data-links']);
  });

  it('elasticsearch-details group has core fields', () => {
    const groups = resolveGroups(schema);
    const details = groups.find((g) => g.group.id === 'elasticsearch-details')!;
    expect(details.group.fieldRefs).toContain('jsonData.index');
    expect(details.group.fieldRefs).toContain('jsonData.timeField');
    expect(details.group.fieldRefs).toContain('jsonData.interval');
    expect(details.group.fieldRefs).toContain('jsonData.timeInterval');
    expect(details.group.fieldRefs).toContain('jsonData.maxConcurrentShardRequests');
  });

  it('logs group has message and level fields', () => {
    const groups = resolveGroups(schema);
    const logs = groups.find((g) => g.group.id === 'logs')!;
    expect(logs.group.fieldRefs).toContain('jsonData.logMessageField');
    expect(logs.group.fieldRefs).toContain('jsonData.logLevelField');
  });

  it('data-links group has dataLinks', () => {
    const groups = resolveGroups(schema);
    const links = groups.find((g) => g.group.id === 'data-links')!;
    expect(links.group.fieldRefs).toContain('jsonData.dataLinks');
  });

  it('connection group has url', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('root.url');
  });

  it('auth group has method selector, basic auth, and apiKey fields', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('auth.method');
    expect(auth.group.fieldRefs).toContain('root.basicAuthUser');
    expect(auth.group.fieldRefs).toContain('secureJsonData.basicAuthPassword');
    expect(auth.group.fieldRefs).toContain('secureJsonData.apiKey');
  });

  it('tls group has cert fields', () => {
    const groups = resolveGroups(schema);
    const tls = groups.find((g) => g.group.id === 'tls')!;
    expect(tls.group.fieldRefs).toContain('jsonData.tlsAuthWithCACert');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsAuth');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsSkipVerify');
  });

  it('http group has headers, cookies, and timeout', () => {
    const groups = resolveGroups(schema);
    const http = groups.find((g) => g.group.id === 'http')!;
    expect(http.group.fieldRefs).toContain('httpHeaders');
    expect(http.group.fieldRefs).toContain('jsonData.keepCookies');
    expect(http.group.fieldRefs).toContain('jsonData.timeout');
  });

  it('elasticsearch-details group also has frozen indices and default query mode', () => {
    const groups = resolveGroups(schema);
    const details = groups.find((g) => g.group.id === 'elasticsearch-details')!;
    expect(details.group.fieldRefs).toContain('jsonData.includeFrozen');
    expect(details.group.fieldRefs).toContain('jsonData.defaultQueryMode');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Elasticsearch required fields', () => {
  it('timeField is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.timeField')!;
    expect(field.required).toBe(true);
  });
});

// ============================================================
// Default values
// ============================================================

describe('Elasticsearch default values', () => {
  it('timeField defaults to @timestamp', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.timeField')!;
    expect(field.defaultValue).toBe('@timestamp');
  });

  it('timeInterval defaults to 10s', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.timeInterval')!;
    expect(field.defaultValue).toBe('10s');
  });

  it('maxConcurrentShardRequests defaults to 5', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.maxConcurrentShardRequests')!;
    expect(field.defaultValue).toBe(5);
  });
});

// ============================================================
// Conditional visibility — API Key auth
// ============================================================

describe('Elasticsearch conditional visibility (auth methods)', () => {
  it('apiKey is visible when auth method is api-key', () => {
    const ids = visibleFieldIds({ authMethod: 'api-key' });
    expect(ids).toContain('secureJsonData.apiKey');
  });

  it('apiKey is hidden when auth method is no-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'no-auth' });
    expect(ids).not.toContain('secureJsonData.apiKey');
  });

  it('basicAuthUser is visible when auth method is basic-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'basic-auth' });
    expect(ids).toContain('root.basicAuthUser');
    expect(ids).toContain('secureJsonData.basicAuthPassword');
  });

  it('basicAuthUser is hidden when auth method is no-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'no-auth' });
    expect(ids).not.toContain('root.basicAuthUser');
    expect(ids).not.toContain('secureJsonData.basicAuthPassword');
  });

  it('TLS CA cert is visible when self-signed cert is enabled', () => {
    const ids = visibleFieldIds({ tlsAuthWithCACert: true });
    expect(ids).toContain('secureJsonData.tlsCACert');
  });

  it('TLS CA cert is hidden when self-signed cert is disabled', () => {
    const ids = visibleFieldIds({ tlsAuthWithCACert: false });
    expect(ids).not.toContain('secureJsonData.tlsCACert');
  });

  it('TLS client cert fields visible when TLS auth is enabled', () => {
    const ids = visibleFieldIds({ tlsAuth: true });
    expect(ids).toContain('secureJsonData.tlsClientCert');
    expect(ids).toContain('secureJsonData.tlsClientKey');
    expect(ids).toContain('jsonData.serverName');
  });

  it('TLS client cert fields hidden when TLS auth is disabled', () => {
    const ids = visibleFieldIds({ tlsAuth: false });
    expect(ids).not.toContain('secureJsonData.tlsClientCert');
    expect(ids).not.toContain('secureJsonData.tlsClientKey');
    expect(ids).not.toContain('jsonData.serverName');
  });
});

// ============================================================
// Non-conditional fields
// ============================================================

describe('Elasticsearch always-visible fields', () => {
  it('timeField is always visible', () => {
    expect(visibleFieldIds({})).toContain('jsonData.timeField');
  });

  it('index is always visible', () => {
    expect(visibleFieldIds({})).toContain('jsonData.index');
  });

  it('interval is always visible', () => {
    expect(visibleFieldIds({})).toContain('jsonData.interval');
  });

  it('maxConcurrentShardRequests is always visible', () => {
    expect(visibleFieldIds({})).toContain('jsonData.maxConcurrentShardRequests');
  });

  it('logMessageField is always visible', () => {
    expect(visibleFieldIds({})).toContain('jsonData.logMessageField');
  });

  it('includeFrozen is always visible', () => {
    expect(visibleFieldIds({})).toContain('jsonData.includeFrozen');
  });

  it('url is always visible', () => {
    expect(visibleFieldIds({})).toContain('root.url');
  });

  it('auth.method is always visible', () => {
    expect(visibleFieldIds({})).toContain('auth.method');
  });

  it('managed auth flags are hidden', () => {
    const ids = visibleFieldIds({});
    expect(ids).not.toContain('jsonData.sigV4Auth');
    expect(ids).not.toContain('jsonData.oauthPassThru');
    expect(ids).not.toContain('jsonData.apiKeyAuth');
    expect(ids).not.toContain('root.basicAuth');
    expect(ids).not.toContain('root.withCredentials');
  });
});

// ============================================================
// UI components
// ============================================================

describe('Elasticsearch field UI components', () => {
  it('interval uses select with date pattern options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.interval')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.label)).toContain('Daily');
    expect(field.ui?.options?.map((o) => o.label)).toContain('Hourly');
  });

  it('includeFrozen uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.includeFrozen')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('auth.method uses select with all auth options', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual([
      'no-auth',
      'basic-auth',
      'forward-oauth',
      'cross-site',
      'api-key',
      'sigv4',
    ]);
  });

  it('auth.method is a virtual field with effects', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    expect(field.kind).toBe('virtual');
    expect(field.effects).toHaveLength(6);
  });

  it('apiKey has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.apiKey')!;
    expect(field.semanticType).toBe('token');
  });

  it('timeInterval has duration semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.timeInterval')!;
    expect(field.semanticType).toBe('duration');
  });
});

// ============================================================
// Data links array field
// ============================================================

describe('Elasticsearch data links field', () => {
  it('dataLinks is an array type', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.dataLinks')!;
    expect(field.valueType).toBe('array');
  });

  it('dataLinks has object item schema with fields', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.dataLinks')!;
    expect(field.item?.valueType).toBe('object');
    expect(field.item?.fields).toBeDefined();
    expect(field.item!.fields!.length).toBe(4);
  });

  it('dataLinks item has field, url, urlDisplayLabel, and datasourceUid', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.dataLinks')!;
    const itemFieldKeys = field.item!.fields!.map((f) => f.key);
    expect(itemFieldKeys).toContain('field');
    expect(itemFieldKeys).toContain('url');
    expect(itemFieldKeys).toContain('urlDisplayLabel');
    expect(itemFieldKeys).toContain('datasourceUid');
  });

  it('datasourceUid item field has datasourceUid semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.dataLinks')!;
    const dsUid = field.item!.fields!.find((f) => f.key === 'datasourceUid')!;
    expect(dsUid.semanticType).toBe('datasourceUid');
  });
});

// ============================================================
// Schema metadata
// ============================================================

describe('Elasticsearch schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('elasticsearch');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Elasticsearch');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/grafana/latest/datasources/elasticsearch/configure/');
  });
});
