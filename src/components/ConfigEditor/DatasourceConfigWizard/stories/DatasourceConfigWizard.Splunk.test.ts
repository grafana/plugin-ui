/**
 * Tests for Splunk schema field visibility, groups, and conditional fields.
 *
 * Validates that the correct fields render for each configuration variant
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import splunkSchemaJson from '../../../../schema/registry/grafana-splunk-datasource.schema.json';

const schema = splunkSchemaJson as unknown as DatasourceConfigSchema;

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

describe('Splunk schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(36);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth', 'http-network', 'search', 'fields', 'advanced']);
  });

  it('connection group has url and apiURL', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('root.url');
    expect(conn.group.fieldRefs).toContain('jsonData.apiURL');
  });

  it('auth group has method, user, password, and token', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('auth.method');
    expect(auth.group.fieldRefs).toContain('root.basicAuthUser');
    expect(auth.group.fieldRefs).toContain('secureJsonData.basicAuthPassword');
    expect(auth.group.fieldRefs).toContain('secureJsonData.authToken');
  });

  it('http-network group has TLS, headers, cookies, and timeout', () => {
    const groups = resolveGroups(schema);
    const http = groups.find((g) => g.group.id === 'http-network')!;
    expect(http.group.fieldRefs).toContain('jsonData.tlsAuthWithCACert');
    expect(http.group.fieldRefs).toContain('jsonData.tlsAuth');
    expect(http.group.fieldRefs).toContain('jsonData.tlsSkipVerify');
    expect(http.group.fieldRefs).toContain('httpHeaders');
    expect(http.group.fieldRefs).toContain('jsonData.keepCookies');
    expect(http.group.fieldRefs).toContain('jsonData.timeout');
  });

  it('search group has async queries and search settings', () => {
    const groups = resolveGroups(schema);
    const search = groups.find((g) => g.group.id === 'search')!;
    expect(search.group.fieldRefs).toContain('jsonData.pollSearchResult');
    expect(search.group.fieldRefs).toContain('jsonData.previewMode');
    expect(search.group.fieldRefs).toContain('jsonData.streamMode');
    expect(search.group.fieldRefs).toContain('jsonData.autoCancel');
    expect(search.group.fieldRefs).toContain('jsonData.statusBuckets');
    expect(search.group.fieldRefs).toContain('jsonData.defaultEarliestTime');
  });

  it('fields group has timestamp and filtration', () => {
    const groups = resolveGroups(schema);
    const fields = groups.find((g) => g.group.id === 'fields')!;
    expect(fields.group.fieldRefs).toContain('jsonData.tsField');
    expect(fields.group.fieldRefs).toContain('jsonData.internalFieldsFiltration');
    expect(fields.group.fieldRefs).toContain('jsonData.internalFieldPattern');
    expect(fields.group.fieldRefs).toContain('jsonData.fieldSearchType');
    expect(fields.group.fieldRefs).toContain('jsonData.variableSearchLevel');
  });

  it('advanced group has result count, timeout, socks proxy, and data links', () => {
    const groups = resolveGroups(schema);
    const advanced = groups.find((g) => g.group.id === 'advanced')!;
    expect(advanced.group.fieldRefs).toContain('jsonData.maxResultCount');
    expect(advanced.group.fieldRefs).toContain('jsonData.timeoutInSeconds');
    expect(advanced.group.fieldRefs).toContain('jsonData.enableSecureSocksProxy');
    expect(advanced.group.fieldRefs).toContain('jsonData.dataLinks');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Splunk required fields', () => {
  it('URL is required', () => {
    const field = schema.fields.find((f) => f.id === 'root.url')!;
    expect(field.required).toBe(true);
  });
});

// ============================================================
// Default values
// ============================================================

describe('Splunk default values', () => {
  it('auth method defaults to basic-auth', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    expect(field.defaultValue).toBe('basic-auth');
  });

  it('tsField defaults to _time', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.tsField')!;
    expect(field.defaultValue).toBe('_time');
  });

  it('fieldSearchType defaults to quick', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.fieldSearchType')!;
    expect(field.defaultValue).toBe('quick');
  });

  it('variableSearchLevel defaults to fast', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variableSearchLevel')!;
    expect(field.defaultValue).toBe('fast');
  });

  it('timeoutInSeconds defaults to 30', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.timeoutInSeconds')!;
    expect(field.defaultValue).toBe(30);
  });

  it('maxResultCount defaults to 0', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.maxResultCount')!;
    expect(field.defaultValue).toBe(0);
  });
});

// ============================================================
// Conditional visibility
// ============================================================

describe('Splunk conditional visibility', () => {
  it('basicAuthUser is visible when auth method is basic-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'basic-auth' });
    expect(ids).toContain('root.basicAuthUser');
  });

  it('basicAuthUser is hidden when auth method is token', () => {
    const ids = visibleFieldIds({ authMethod: 'token' });
    expect(ids).not.toContain('root.basicAuthUser');
  });

  it('basicAuthPassword is visible when auth method is basic-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'basic-auth' });
    expect(ids).toContain('secureJsonData.basicAuthPassword');
  });

  it('basicAuthPassword is hidden when auth method is token', () => {
    const ids = visibleFieldIds({ authMethod: 'token' });
    expect(ids).not.toContain('secureJsonData.basicAuthPassword');
  });

  it('authToken is visible when auth method is token', () => {
    const ids = visibleFieldIds({ authMethod: 'token' });
    expect(ids).toContain('secureJsonData.authToken');
  });

  it('authToken is hidden when auth method is basic-auth', () => {
    const ids = visibleFieldIds({ authMethod: 'basic-auth' });
    expect(ids).not.toContain('secureJsonData.authToken');
  });

  it('internalFieldPattern is hidden when internalFieldsFiltration is off', () => {
    const ids = visibleFieldIds({ internalFieldsFiltration: false });
    expect(ids).not.toContain('jsonData.internalFieldPattern');
  });

  it('internalFieldPattern is visible when internalFieldsFiltration is on', () => {
    const ids = visibleFieldIds({ internalFieldsFiltration: true });
    expect(ids).toContain('jsonData.internalFieldPattern');
  });

  it('poll interval fields are hidden when async queries is off', () => {
    const ids = visibleFieldIds({ pollSearchResult: false, previewMode: false });
    expect(ids).not.toContain('jsonData.minPollInterval');
    expect(ids).not.toContain('jsonData.maxPollInterval');
  });

  it('poll interval fields are visible when async queries is on', () => {
    const ids = visibleFieldIds({ pollSearchResult: true });
    expect(ids).toContain('jsonData.minPollInterval');
    expect(ids).toContain('jsonData.maxPollInterval');
  });

  it('poll interval fields are visible when preview mode is on', () => {
    const ids = visibleFieldIds({ previewMode: true });
    expect(ids).toContain('jsonData.minPollInterval');
    expect(ids).toContain('jsonData.maxPollInterval');
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

  it('CA cert is hidden when tlsAuthWithCACert is off', () => {
    const ids = visibleFieldIds({ tlsAuthWithCACert: false });
    expect(ids).not.toContain('secureJsonData.tlsCACert');
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

// ============================================================
// UI components
// ============================================================

describe('Splunk field UI components', () => {
  it('auth.method uses select with basic-auth and token options', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['basic-auth', 'token']);
  });

  it('fieldSearchType uses select with quick and full options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.fieldSearchType')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['quick', 'full']);
  });

  it('variableSearchLevel uses select with fast, smart, verbose options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variableSearchLevel')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['fast', 'smart', 'verbose']);
  });

  it('internalFieldsFiltration uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.internalFieldsFiltration')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('previewMode uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.previewMode')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('pollSearchResult uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.pollSearchResult')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('keepCookies uses list component', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.keepCookies')!;
    expect(field.ui?.component).toBe('list');
  });
});

// ============================================================
// Auth effects
// ============================================================

describe('Splunk auth effects', () => {
  it('auth.method has effects for basic-auth and token', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    expect(field.effects).toHaveLength(2);
  });

  it('basic-auth effect sets basicAuth true and authType to BasicAuth', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    const basicEffect = field.effects?.find((e) => e.when === "value == 'basic-auth'");
    expect(basicEffect).toBeDefined();
    expect(basicEffect?.set['root.basicAuth']).toBe(true);
    expect(basicEffect?.set['jsonData.authType']).toBe('BasicAuth');
    expect(basicEffect?.set['jsonData.oauthPassThru']).toBe(false);
  });

  it('token effect sets authType to custom-splunk', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    const tokenEffect = field.effects?.find((e) => e.when === "value == 'token'");
    expect(tokenEffect).toBeDefined();
    expect(tokenEffect?.set['root.basicAuth']).toBe(false);
    expect(tokenEffect?.set['jsonData.authType']).toBe('custom-splunk');
  });

  it('both effects set oauthPassThru to false', () => {
    const field = schema.fields.find((f) => f.id === 'auth.method')!;
    for (const effect of field.effects ?? []) {
      expect(effect.set['jsonData.oauthPassThru']).toBe(false);
    }
  });
});

// ============================================================
// Relationships
// ============================================================

describe('Splunk relationships', () => {
  it('has pair relationship for TLS cert and key', () => {
    const tls = schema.relationships?.find(
      (r) => r.type === 'pair' && r.fields.includes('secureJsonData.tlsClientCert')
    );
    expect(tls).toBeDefined();
    expect(tls?.fields).toContain('secureJsonData.tlsClientKey');
  });
});

// ============================================================
// Data links schema
// ============================================================

describe('Splunk data links', () => {
  it('dataLinks is an array type', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.dataLinks')!;
    expect(field.valueType).toBe('array');
  });

  it('dataLinks items have expected sub-fields', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.dataLinks')!;
    const subFieldKeys = field.item?.fields?.map((f) => f.key) ?? [];
    expect(subFieldKeys).toContain('field');
    expect(subFieldKeys).toContain('matcherRegex');
    expect(subFieldKeys).toContain('url');
    expect(subFieldKeys).toContain('datasourceUid');
  });
});

// ============================================================
// HTTP Headers storage
// ============================================================

describe('Splunk HTTP headers', () => {
  it('httpHeaders uses indexedPair storage', () => {
    const field = schema.fields.find((f) => f.id === 'httpHeaders')!;
    expect(field.storage?.type).toBe('indexedPair');
  });

  it('httpHeaders item has name and value fields', () => {
    const field = schema.fields.find((f) => f.id === 'httpHeaders')!;
    const subFieldKeys = field.item?.fields?.map((f) => f.key) ?? [];
    expect(subFieldKeys).toContain('name');
    expect(subFieldKeys).toContain('value');
  });
});
