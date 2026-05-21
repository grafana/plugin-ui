/**
 * Tests for Tempo schema field visibility, groups, and conditional fields.
 *
 * Validates that the correct fields render for each configuration variant
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import tempoSchemaJson from '../../../../schema/registry/tempo.schema.json';

const schema = tempoSchemaJson as unknown as DatasourceConfigSchema;

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

describe('Tempo schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(34);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual([
      'connection',
      'auth',
      'http-network',
      'streaming',
      'trace-to-logs',
      'trace-to-metrics',
      'trace-to-profiles',
      'service-graph',
      'node-graph',
      'search',
      'traceid-query',
      'tags',
      'span-bar',
    ]);
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

  it('streaming group has search and metrics streaming', () => {
    const groups = resolveGroups(schema);
    const streaming = groups.find((g) => g.group.id === 'streaming')!;
    expect(streaming.group.fieldRefs).toContain('jsonData.streamingEnabled.search');
    expect(streaming.group.fieldRefs).toContain('jsonData.streamingEnabled.metrics');
  });

  it('service-graph group has datasource uid', () => {
    const groups = resolveGroups(schema);
    const sg = groups.find((g) => g.group.id === 'service-graph')!;
    expect(sg.group.fieldRefs).toContain('jsonData.serviceMap.datasourceUid');
  });

  it('node-graph group has enabled toggle', () => {
    const groups = resolveGroups(schema);
    const ng = groups.find((g) => g.group.id === 'node-graph')!;
    expect(ng.group.fieldRefs).toContain('jsonData.nodeGraph.enabled');
  });

  it('traceid-query group has time shift fields', () => {
    const groups = resolveGroups(schema);
    const tq = groups.find((g) => g.group.id === 'traceid-query')!;
    expect(tq.group.fieldRefs).toContain('jsonData.traceQuery.timeShiftEnabled');
    expect(tq.group.fieldRefs).toContain('jsonData.traceQuery.spanStartTimeShift');
    expect(tq.group.fieldRefs).toContain('jsonData.traceQuery.spanEndTimeShift');
  });

  it('tags group has time range and tag limit', () => {
    const groups = resolveGroups(schema);
    const tags = groups.find((g) => g.group.id === 'tags')!;
    expect(tags.group.fieldRefs).toContain('jsonData.timeRangeForTags');
    expect(tags.group.fieldRefs).toContain('jsonData.tagLimit');
  });

  it('search group has hide and filters', () => {
    const groups = resolveGroups(schema);
    const search = groups.find((g) => g.group.id === 'search')!;
    expect(search.group.fieldRefs).toContain('jsonData.search.hide');
    expect(search.group.fieldRefs).toContain('jsonData.search.filters');
  });

  it('span-bar group has type and tag fields', () => {
    const groups = resolveGroups(schema);
    const sb = groups.find((g) => g.group.id === 'span-bar')!;
    expect(sb.group.fieldRefs).toContain('jsonData.spanBar.type');
    expect(sb.group.fieldRefs).toContain('jsonData.spanBar.tag');
  });

  it('trace-to-logs group has tracesToLogsV2', () => {
    const groups = resolveGroups(schema);
    const ttl = groups.find((g) => g.group.id === 'trace-to-logs')!;
    expect(ttl.group.fieldRefs).toContain('jsonData.tracesToLogsV2');
  });

  it('trace-to-metrics group has tracesToMetrics', () => {
    const groups = resolveGroups(schema);
    const ttm = groups.find((g) => g.group.id === 'trace-to-metrics')!;
    expect(ttm.group.fieldRefs).toContain('jsonData.tracesToMetrics');
  });

  it('trace-to-profiles group has tracesToProfiles', () => {
    const groups = resolveGroups(schema);
    const ttp = groups.find((g) => g.group.id === 'trace-to-profiles')!;
    expect(ttp.group.fieldRefs).toContain('jsonData.tracesToProfiles');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Tempo required fields', () => {
  it('URL is required', () => {
    const field = schema.fields.find((f) => f.id === 'root.url')!;
    expect(field.required).toBe(true);
  });
});

// ============================================================
// Default values
// ============================================================

describe('Tempo default values', () => {
  it('tagLimit defaults to 5000', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.tagLimit')!;
    expect(field.defaultValue).toBe(5000);
  });

  it('spanStartTimeShift defaults to 30m', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.traceQuery.spanStartTimeShift')!;
    expect(field.defaultValue).toBe('30m');
  });

  it('spanEndTimeShift defaults to 30m', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.traceQuery.spanEndTimeShift')!;
    expect(field.defaultValue).toBe('30m');
  });
});

// ============================================================
// Conditional visibility
// ============================================================

describe('Tempo conditional visibility', () => {
  it('spanStartTimeShift is hidden when timeShiftEnabled is off', () => {
    const ids = visibleFieldIds({ traceQuery: { timeShiftEnabled: false } });
    expect(ids).not.toContain('jsonData.traceQuery.spanStartTimeShift');
    expect(ids).not.toContain('jsonData.traceQuery.spanEndTimeShift');
  });

  it('spanStartTimeShift is visible when timeShiftEnabled is on', () => {
    const ids = visibleFieldIds({ traceQuery: { timeShiftEnabled: true } });
    expect(ids).toContain('jsonData.traceQuery.spanStartTimeShift');
    expect(ids).toContain('jsonData.traceQuery.spanEndTimeShift');
  });

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

  it('TLS server name is hidden when tlsAuth is off', () => {
    const ids = visibleFieldIds({ tlsAuth: false });
    expect(ids).not.toContain('jsonData.serverName');
  });

  it('TLS server name is visible when tlsAuth is on', () => {
    const ids = visibleFieldIds({ tlsAuth: true });
    expect(ids).toContain('jsonData.serverName');
  });

  it('spanBar.tag is hidden when spanBar.type is Duration', () => {
    const ids = visibleFieldIds({ spanBar: { type: 'Duration' } });
    expect(ids).not.toContain('jsonData.spanBar.tag');
  });

  it('spanBar.tag is hidden when spanBar.type is None', () => {
    const ids = visibleFieldIds({ spanBar: { type: 'None' } });
    expect(ids).not.toContain('jsonData.spanBar.tag');
  });

  it('spanBar.tag is visible when spanBar.type is Tag', () => {
    const ids = visibleFieldIds({ spanBar: { type: 'Tag' } });
    expect(ids).toContain('jsonData.spanBar.tag');
  });
});

// ============================================================
// UI components
// ============================================================

describe('Tempo field UI components', () => {
  it('spanBar.type uses select with None, Duration, Tag options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.spanBar.type')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['None', 'Duration', 'Tag']);
  });
});

// ============================================================
// Relationships
// ============================================================

describe('Tempo relationships', () => {
  it('has datasourceReference for service graph pointing to prometheus', () => {
    const dsRef = schema.relationships?.find((r) => r.type === 'datasourceReference');
    expect(dsRef).toBeDefined();
    expect(dsRef?.fields).toContain('jsonData.serviceMap.datasourceUid');
    expect(dsRef?.targetPluginType).toBe('prometheus');
  });

  it('has pair relationship for TLS cert and key', () => {
    const tls = schema.relationships?.find(
      (r) => r.type === 'pair' && r.fields.includes('secureJsonData.tlsClientCert')
    );
    expect(tls).toBeDefined();
    expect(tls?.fields).toContain('secureJsonData.tlsClientKey');
  });
});
