/**
 * Tests for MySQL schema field visibility, groups, and conditional TLS fields.
 *
 * These validate that the correct fields render for each TLS toggle state
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../../../../datasource/schema/config';
import { evaluateCelExpression } from '../../../../datasource/schema/cel';
import mysqlSchemaJson from '../../../../datasource/schema/datasources/mysql.schema.json';

const schema = mysqlSchemaJson as unknown as DatasourceConfigSchema;

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

describe('MySQL schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(17);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth', 'tls', 'mysql-options', 'connection-limits']);
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
    expect(auth.group.fieldRefs).toEqual(['root.user', 'secureJsonData.password']);
  });

  it('tls group has switches and conditional cert fields', () => {
    const groups = resolveGroups(schema);
    const tls = groups.find((g) => g.group.id === 'tls')!;
    expect(tls.group.title).toBe('TLS/SSL Settings');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsAuth');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsAuthWithCACert');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsSkipVerify');
    expect(tls.group.fieldRefs).toContain('jsonData.allowCleartextPasswords');
    expect(tls.group.fieldRefs).toContain('secureJsonData.tlsCACert');
    expect(tls.group.fieldRefs).toContain('secureJsonData.tlsClientCert');
    expect(tls.group.fieldRefs).toContain('secureJsonData.tlsClientKey');
  });

  it('mysql-options group has timezone and time interval', () => {
    const groups = resolveGroups(schema);
    const opts = groups.find((g) => g.group.id === 'mysql-options')!;
    expect(opts.group.fieldRefs).toContain('jsonData.timezone');
    expect(opts.group.fieldRefs).toContain('jsonData.timeInterval');
  });

  it('connection-limits has 4 fields', () => {
    const groups = resolveGroups(schema);
    const limits = groups.find((g) => g.group.id === 'connection-limits')!;
    expect(limits.group.fieldRefs).toHaveLength(4);
    expect(limits.group.fieldRefs).toContain('jsonData.maxOpenConns');
    expect(limits.group.fieldRefs).toContain('jsonData.maxIdleConns');
    expect(limits.group.fieldRefs).toContain('jsonData.maxIdleConnsAuto');
    expect(limits.group.fieldRefs).toContain('jsonData.connMaxLifetime');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('MySQL required fields', () => {
  it('host URL is required', () => {
    const f = schema.fields.find((f) => f.id === 'root.url')!;
    expect(f.required).toBe(true);
  });

  it('username is required', () => {
    const f = schema.fields.find((f) => f.id === 'root.user')!;
    expect(f.required).toBe(true);
  });

  it('database name is NOT required', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.database')!;
    expect(f.required).toBeUndefined();
  });

  it('password is NOT required', () => {
    const f = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(f.required).toBeUndefined();
  });

  it('database has computed storage read from root.database', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.database')!;
    expect(f.storage).toEqual({ type: 'computed', read: 'root.database' });
  });
});

// ============================================================
// Default values
// ============================================================

describe('MySQL default values', () => {
  it('maxOpenConns defaults to 100', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.maxOpenConns')!;
    expect(f.defaultValue).toBe(100);
  });

  it('maxIdleConns defaults to 100', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.maxIdleConns')!;
    expect(f.defaultValue).toBe(100);
  });

  it('maxIdleConns is disabled when maxIdleConnsAuto is true', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.maxIdleConns')!;
    expect(f.disabledWhen).toBe('jsonData.maxIdleConnsAuto == true');
  });

  it('connMaxLifetime defaults to 14400', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.connMaxLifetime')!;
    expect(f.defaultValue).toBe(14400);
  });
});

// ============================================================
// UI components
// ============================================================

describe('MySQL field UI components', () => {
  it('all four TLS/auth toggles use switch', () => {
    for (const id of [
      'jsonData.tlsAuth',
      'jsonData.tlsAuthWithCACert',
      'jsonData.tlsSkipVerify',
      'jsonData.allowCleartextPasswords',
    ]) {
      const f = schema.fields.find((f) => f.id === id)!;
      expect(f.ui?.component).toBe('switch');
    }
  });

  it('cert fields use textarea', () => {
    for (const id of ['secureJsonData.tlsCACert', 'secureJsonData.tlsClientCert', 'secureJsonData.tlsClientKey']) {
      const f = schema.fields.find((f) => f.id === id)!;
      expect(f.ui?.component).toBe('textarea');
    }
  });

  it('password is a secret field', () => {
    const f = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(f.semanticType).toBe('password');
  });

  it('client key has token semantic type', () => {
    const f = schema.fields.find((f) => f.id === 'secureJsonData.tlsClientKey')!;
    expect(f.semanticType).toBe('token');
  });
});

// ============================================================
// TLS disabled (default)
// ============================================================

describe('MySQL TLS disabled (default)', () => {
  const values: Record<string, unknown> = {
    tlsAuth: false,
    tlsAuthWithCACert: false,
  };

  it('shows connection and auth fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.url');
    expect(ids).toContain('jsonData.database');
    expect(ids).toContain('root.user');
    expect(ids).toContain('secureJsonData.password');
  });

  it('shows TLS toggle switches', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.tlsAuth');
    expect(ids).toContain('jsonData.tlsAuthWithCACert');
    expect(ids).toContain('jsonData.tlsSkipVerify');
    expect(ids).toContain('jsonData.allowCleartextPasswords');
  });

  it('hides CA cert textarea', () => {
    expect(visibleFieldIds(values)).not.toContain('secureJsonData.tlsCACert');
  });

  it('hides client cert and key textareas', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('secureJsonData.tlsClientCert');
    expect(ids).not.toContain('secureJsonData.tlsClientKey');
  });

  it('shows MySQL options', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.timezone');
    expect(ids).toContain('jsonData.timeInterval');
  });

  it('shows connection limits', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.maxOpenConns');
    expect(ids).toContain('jsonData.maxIdleConns');
    expect(ids).toContain('jsonData.maxIdleConnsAuto');
    expect(ids).toContain('jsonData.connMaxLifetime');
  });
});

// ============================================================
// TLS client auth enabled
// ============================================================

describe('MySQL TLS client auth enabled', () => {
  const values: Record<string, unknown> = {
    tlsAuth: true,
    tlsAuthWithCACert: false,
  };

  it('shows client cert and key', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('secureJsonData.tlsClientCert');
    expect(ids).toContain('secureJsonData.tlsClientKey');
  });

  it('still hides CA cert', () => {
    expect(visibleFieldIds(values)).not.toContain('secureJsonData.tlsCACert');
  });
});

// ============================================================
// TLS with CA cert enabled
// ============================================================

describe('MySQL TLS with CA cert enabled', () => {
  const values: Record<string, unknown> = {
    tlsAuth: false,
    tlsAuthWithCACert: true,
  };

  it('shows CA cert textarea', () => {
    expect(visibleFieldIds(values)).toContain('secureJsonData.tlsCACert');
  });

  it('hides client cert and key', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('secureJsonData.tlsClientCert');
    expect(ids).not.toContain('secureJsonData.tlsClientKey');
  });
});

// ============================================================
// TLS fully enabled
// ============================================================

describe('MySQL TLS fully enabled', () => {
  const values: Record<string, unknown> = {
    tlsAuth: true,
    tlsAuthWithCACert: true,
  };

  it('shows all TLS cert fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('secureJsonData.tlsCACert');
    expect(ids).toContain('secureJsonData.tlsClientCert');
    expect(ids).toContain('secureJsonData.tlsClientKey');
  });
});
