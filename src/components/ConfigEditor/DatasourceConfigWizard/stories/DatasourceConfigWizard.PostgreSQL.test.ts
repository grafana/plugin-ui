/**
 * Tests for PostgreSQL schema field visibility, groups, and conditional TLS fields.
 *
 * These validate that the correct fields render for each TLS/SSL mode
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import postgresSchemaJson from '../../../../schema/registry/grafana-postgresql-datasource.schema.json';

const schema = postgresSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Helpers
// ============================================================

/** Build a fieldById map from the schema. */
function buildFieldMap(): Map<string, ConfigField> {
  const m = new Map<string, ConfigField>();
  for (const f of schema.fields) {
    m.set(f.id, f);
  }
  return m;
}

/** Build a CEL context from flat form values and field definitions. */
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

/** Check if a field is visible given current form values. */
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

/** Get visible field IDs for given form values. */
function visibleFieldIds(values: Record<string, unknown>): string[] {
  return schema.fields.filter((f) => isVisible(f, values)).map((f) => f.id);
}

// ============================================================
// Schema structure
// ============================================================

describe('PostgreSQL schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(17);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth', 'tls', 'postgres-options', 'connection-limits']);
  });

  it('connection group has host and database', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('root.url');
    expect(conn.group.fieldRefs).toContain('jsonData.database');
  });

  it('auth group has username and password only', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('root.user');
    expect(auth.group.fieldRefs).toContain('secureJsonData.password');
    expect(auth.group.fieldRefs).not.toContain('jsonData.sslmode');
  });

  it('tls group has sslmode, TLS method, and all cert fields', () => {
    const groups = resolveGroups(schema);
    const tls = groups.find((g) => g.group.id === 'tls')!;
    expect(tls.group.title).toBe('TLS/SSL Settings');
    expect(tls.group.fieldRefs).toContain('jsonData.sslmode');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsConfigurationMethod');
    expect(tls.group.fieldRefs).toContain('jsonData.sslRootCertFile');
    expect(tls.group.fieldRefs).toContain('secureJsonData.tlsClientCert');
  });

  it('postgres-options group has version, time interval, and timescaledb', () => {
    const groups = resolveGroups(schema);
    const opts = groups.find((g) => g.group.id === 'postgres-options')!;
    expect(opts.group.fieldRefs).toContain('jsonData.postgresVersion');
    expect(opts.group.fieldRefs).toContain('jsonData.timeInterval');
    expect(opts.group.fieldRefs).toContain('jsonData.timescaledb');
  });

  it('connection-limits group has maxOpenConns and connMaxLifetime', () => {
    const groups = resolveGroups(schema);
    const limits = groups.find((g) => g.group.id === 'connection-limits')!;
    expect(limits.group.fieldRefs).toContain('jsonData.maxOpenConns');
    expect(limits.group.fieldRefs).toContain('jsonData.connMaxLifetime');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('PostgreSQL required fields', () => {
  it('host URL is required', () => {
    const field = schema.fields.find((f) => f.id === 'root.url')!;
    expect(field.required).toBe(true);
  });

  it('database name is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.database')!;
    expect(field.required).toBe(true);
  });

  it('username is required', () => {
    const field = schema.fields.find((f) => f.id === 'root.user')!;
    expect(field.required).toBe(true);
  });

  it('database has computed storage read from root.database', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.database')!;
    expect(field.storage).toEqual({ type: 'computed', read: 'root.database' });
  });
});

// ============================================================
// Default values
// ============================================================

describe('PostgreSQL default values', () => {
  it('sslmode defaults to require', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.sslmode')!;
    expect(field.defaultValue).toBe('require');
  });

  it('TLS method defaults to file-path', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.tlsConfigurationMethod')!;
    expect(field.defaultValue).toBe('file-path');
  });

  it('postgresVersion defaults to 903', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.postgresVersion')!;
    expect(field.defaultValue).toBe(903);
  });

  it('maxOpenConns defaults to 100', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.maxOpenConns')!;
    expect(field.defaultValue).toBe(100);
  });

  it('connMaxLifetime defaults to 14400', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.connMaxLifetime')!;
    expect(field.defaultValue).toBe(14400);
  });
});

// ============================================================
// UI components
// ============================================================

describe('PostgreSQL field UI components', () => {
  it('sslmode uses select', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.sslmode')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['disable', 'require', 'verify-ca', 'verify-full']);
  });

  it('TLS method uses select', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.tlsConfigurationMethod')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['file-path', 'file-content']);
  });

  it('postgresVersion uses select with numeric version values', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.postgresVersion')!;
    expect(field.ui?.component).toBe('select');
    const values = field.ui?.options?.map((o) => o.value);
    expect(values).toContain(900);
    expect(values).toContain(1500);
  });

  it('timescaledb uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.timescaledb')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('password is a secret field', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(field.semanticType).toBe('password');
  });

  it('TLS cert content fields use textarea', () => {
    for (const id of ['secureJsonData.tlsClientCert', 'secureJsonData.tlsCACert', 'secureJsonData.tlsClientKey']) {
      const field = schema.fields.find((f) => f.id === id)!;
      expect(field.ui?.component).toBe('textarea');
    }
  });
});

// ============================================================
// TLS disabled: hide TLS-related fields
// ============================================================

describe('TLS disabled (sslmode=disable)', () => {
  const values: Record<string, unknown> = {
    sslmode: 'disable',
  };

  it('shows connection fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.url');
    expect(ids).toContain('jsonData.database');
    expect(ids).toContain('root.user');
    expect(ids).toContain('secureJsonData.password');
  });

  it('shows sslmode selector', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.sslmode');
  });

  it('hides TLS method selector', () => {
    expect(visibleFieldIds(values)).not.toContain('jsonData.tlsConfigurationMethod');
  });

  it('hides file-path cert fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.sslRootCertFile');
    expect(ids).not.toContain('jsonData.sslCertFile');
    expect(ids).not.toContain('jsonData.sslKeyFile');
  });

  it('hides certificate content fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('secureJsonData.tlsClientCert');
    expect(ids).not.toContain('secureJsonData.tlsCACert');
    expect(ids).not.toContain('secureJsonData.tlsClientKey');
  });

  it('shows PostgreSQL options', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.postgresVersion');
    expect(ids).toContain('jsonData.timeInterval');
    expect(ids).toContain('jsonData.timescaledb');
  });

  it('shows connection limits', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.maxOpenConns');
    expect(ids).toContain('jsonData.connMaxLifetime');
  });
});

// ============================================================
// TLS require with file-path method
// ============================================================

describe('TLS require with file-path method', () => {
  const values: Record<string, unknown> = {
    sslmode: 'require',
    tlsConfigurationMethod: 'file-path',
  };

  it('shows TLS method selector', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.tlsConfigurationMethod');
  });

  it('shows file-path cert fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.sslRootCertFile');
    expect(ids).toContain('jsonData.sslCertFile');
    expect(ids).toContain('jsonData.sslKeyFile');
  });

  it('hides certificate content fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('secureJsonData.tlsClientCert');
    expect(ids).not.toContain('secureJsonData.tlsCACert');
    expect(ids).not.toContain('secureJsonData.tlsClientKey');
  });
});

// ============================================================
// TLS verify-full with file-content method
// ============================================================

describe('TLS verify-full with file-content method', () => {
  const values: Record<string, unknown> = {
    sslmode: 'verify-full',
    tlsConfigurationMethod: 'file-content',
  };

  it('shows TLS method selector', () => {
    expect(visibleFieldIds(values)).toContain('jsonData.tlsConfigurationMethod');
  });

  it('hides file-path cert fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.sslRootCertFile');
    expect(ids).not.toContain('jsonData.sslCertFile');
    expect(ids).not.toContain('jsonData.sslKeyFile');
  });

  it('shows certificate content fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('secureJsonData.tlsClientCert');
    expect(ids).toContain('secureJsonData.tlsCACert');
    expect(ids).toContain('secureJsonData.tlsClientKey');
  });
});

// ============================================================
// TLS verify-ca with file-content method
// ============================================================

describe('TLS verify-ca with file-content method', () => {
  const values: Record<string, unknown> = {
    sslmode: 'verify-ca',
    tlsConfigurationMethod: 'file-content',
  };

  it('shows certificate content fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('secureJsonData.tlsClientCert');
    expect(ids).toContain('secureJsonData.tlsCACert');
    expect(ids).toContain('secureJsonData.tlsClientKey');
  });
});
