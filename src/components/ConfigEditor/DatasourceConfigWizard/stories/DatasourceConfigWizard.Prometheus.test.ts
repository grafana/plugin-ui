/**
 * Tests for Prometheus schema field visibility, groups, and conditional fields.
 *
 * Validates that the correct fields render for each configuration variant
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import prometheusSchemaJson from '../../../../schema/registry/prometheus.schema.json';

const schema = prometheusSchemaJson as unknown as DatasourceConfigSchema;

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

describe('Prometheus schema structure', () => {
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
      'alerting',
      'interval-behaviour',
      'query-editor',
      'performance',
      'other',
      'exemplars',
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

  it('performance group has prometheus type, version, cache, incremental querying, and recording rules', () => {
    const groups = resolveGroups(schema);
    const perf = groups.find((g) => g.group.id === 'performance')!;
    expect(perf.group.fieldRefs).toContain('jsonData.prometheusType');
    expect(perf.group.fieldRefs).toContain('jsonData.prometheusVersion');
    expect(perf.group.fieldRefs).toContain('jsonData.cacheLevel');
    expect(perf.group.fieldRefs).toContain('jsonData.incrementalQuerying');
    expect(perf.group.fieldRefs).toContain('jsonData.incrementalQueryOverlapWindow');
    expect(perf.group.fieldRefs).toContain('jsonData.disableRecordingRules');
  });

  it('query-editor group has default editor and disable metrics lookup', () => {
    const groups = resolveGroups(schema);
    const qe = groups.find((g) => g.group.id === 'query-editor')!;
    expect(qe.group.fieldRefs).toContain('jsonData.defaultEditor');
    expect(qe.group.fieldRefs).toContain('jsonData.disableMetricsLookup');
  });

  it('exemplars group has exemplar trace ID destinations', () => {
    const groups = resolveGroups(schema);
    const exemplars = groups.find((g) => g.group.id === 'exemplars')!;
    expect(exemplars.group.fieldRefs).toContain('jsonData.exemplarTraceIdDestinations');
  });

  it('alerting group has manage alerts and recording rules target', () => {
    const groups = resolveGroups(schema);
    const alerting = groups.find((g) => g.group.id === 'alerting')!;
    expect(alerting.group.fieldRefs).toContain('jsonData.manageAlerts');
    expect(alerting.group.fieldRefs).toContain('jsonData.allowAsRecordingRulesTarget');
  });

  it('http-network group has TLS, headers, cookies, http method, and custom query params', () => {
    const groups = resolveGroups(schema);
    const http = groups.find((g) => g.group.id === 'http-network')!;
    expect(http.group.fieldRefs).toContain('jsonData.httpMethod');
    expect(http.group.fieldRefs).toContain('jsonData.customQueryParameters');
    expect(http.group.fieldRefs).toContain('jsonData.tlsAuth');
    expect(http.group.fieldRefs).toContain('httpHeaders');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Prometheus required fields', () => {
  it('URL is required', () => {
    const field = schema.fields.find((f) => f.id === 'root.url')!;
    expect(field.required).toBe(true);
  });
});

// ============================================================
// Default values
// ============================================================

describe('Prometheus default values', () => {
  it('httpMethod defaults to POST', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.httpMethod')!;
    expect(field.defaultValue).toBe('POST');
  });

  it('cacheLevel defaults to Low', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.cacheLevel')!;
    expect(field.defaultValue).toBe('Low');
  });

  it('defaultEditor defaults to builder', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.defaultEditor')!;
    expect(field.defaultValue).toBe('builder');
  });

  it('incrementalQuerying defaults to false', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.incrementalQuerying')!;
    expect(field.defaultValue).toBe(false);
  });

  it('manageAlerts defaults to true', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.manageAlerts')!;
    expect(field.defaultValue).toBe(true);
  });

  it('seriesLimit defaults to 40000', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.seriesLimit')!;
    expect(field.defaultValue).toBe(40000);
  });
});

// ============================================================
// UI components
// ============================================================

describe('Prometheus field UI components', () => {
  it('httpMethod uses select with GET and POST options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.httpMethod')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['GET', 'POST']);
  });

  it('prometheusType uses select with Prometheus, Cortex, Mimir, Thanos', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.prometheusType')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['Prometheus', 'Cortex', 'Mimir', 'Thanos']);
  });

  it('cacheLevel uses select with Low, Medium, High, None', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.cacheLevel')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['Low', 'Medium', 'High', 'None']);
  });

  it('defaultEditor uses select with builder and code', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.defaultEditor')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['builder', 'code']);
  });
});

// ============================================================
// Conditional visibility
// ============================================================

describe('Prometheus conditional visibility', () => {
  it('incrementalQueryOverlapWindow is hidden when incrementalQuerying is off', () => {
    const ids = visibleFieldIds({ incrementalQuerying: false });
    expect(ids).not.toContain('jsonData.incrementalQueryOverlapWindow');
  });

  it('incrementalQueryOverlapWindow is visible when incrementalQuerying is on', () => {
    const ids = visibleFieldIds({ incrementalQuerying: true });
    expect(ids).toContain('jsonData.incrementalQueryOverlapWindow');
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

  it('CA cert is visible when tlsAuthWithCACert is on', () => {
    const ids = visibleFieldIds({ tlsAuthWithCACert: true });
    expect(ids).toContain('secureJsonData.tlsCACert');
  });
});
