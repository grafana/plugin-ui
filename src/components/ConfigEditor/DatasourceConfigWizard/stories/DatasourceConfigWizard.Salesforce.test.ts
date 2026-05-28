/**
 * Tests for Salesforce schema field visibility, groups, and conditional fields.
 *
 * Validates that the correct fields render for each configuration variant
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import salesforceSchemaJson from '../../../../schema/registry/grafana-salesforce-datasource.schema.json';

const schema = salesforceSchemaJson as unknown as DatasourceConfigSchema;

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

describe('Salesforce schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(12);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'settings']);
  });

  it('connection group has auth type, user, and credential fields', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('jsonData.authType');
    expect(conn.group.fieldRefs).toContain('jsonData.user');
    expect(conn.group.fieldRefs).toContain('secureJsonData.password');
    expect(conn.group.fieldRefs).toContain('secureJsonData.securityToken');
    expect(conn.group.fieldRefs).toContain('secureJsonData.clientID');
    expect(conn.group.fieldRefs).toContain('secureJsonData.clientSecret');
    expect(conn.group.fieldRefs).toContain('secureJsonData.cert');
    expect(conn.group.fieldRefs).toContain('secureJsonData.privateKey');
  });

  it('settings group has environment and socks proxy', () => {
    const groups = resolveGroups(schema);
    const settings = groups.find((g) => g.group.id === 'settings')!;
    expect(settings.group.fieldRefs).toContain('environment');
    expect(settings.group.fieldRefs).toContain('jsonData.enableSecureSocksProxy');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Salesforce required fields', () => {
  it('authType is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.authType')!;
    expect(field.required).toBe(true);
  });

  it('user is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.user')!;
    expect(field.required).toBe(true);
  });

  it('clientID is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.clientID')!;
    expect(field.required).toBe(true);
  });

  it('password is conditionally required in credentials mode', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(field.requiredWhen).toBe("jsonData.authType == 'user'");
  });

  it('clientSecret is conditionally required in credentials mode', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.clientSecret')!;
    expect(field.requiredWhen).toBe("jsonData.authType == 'user'");
  });

  it('cert is conditionally required in JWT mode', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.cert')!;
    expect(field.requiredWhen).toBe("jsonData.authType == 'jwt'");
  });

  it('privateKey is conditionally required in JWT mode', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.privateKey')!;
    expect(field.requiredWhen).toBe("jsonData.authType == 'jwt'");
  });
});

// ============================================================
// Default values
// ============================================================

describe('Salesforce default values', () => {
  it('authType defaults to user (Credentials)', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.authType')!;
    expect(field.defaultValue).toBe('user');
  });

  it('environment defaults to production', () => {
    const field = schema.fields.find((f) => f.id === 'environment')!;
    expect(field.defaultValue).toBe('production');
  });
});

// ============================================================
// Conditional visibility — Credentials mode
// ============================================================

describe('Salesforce conditional visibility (Credentials mode)', () => {
  const credValues = { authType: 'user' };

  it('password is visible in Credentials mode', () => {
    const ids = visibleFieldIds(credValues);
    expect(ids).toContain('secureJsonData.password');
  });

  it('securityToken is visible in Credentials mode', () => {
    const ids = visibleFieldIds(credValues);
    expect(ids).toContain('secureJsonData.securityToken');
  });

  it('clientID is visible in Credentials mode', () => {
    const ids = visibleFieldIds(credValues);
    expect(ids).toContain('secureJsonData.clientID');
  });

  it('clientSecret is visible in Credentials mode', () => {
    const ids = visibleFieldIds(credValues);
    expect(ids).toContain('secureJsonData.clientSecret');
  });

  it('cert is hidden in Credentials mode', () => {
    const ids = visibleFieldIds(credValues);
    expect(ids).not.toContain('secureJsonData.cert');
  });

  it('privateKey is hidden in Credentials mode', () => {
    const ids = visibleFieldIds(credValues);
    expect(ids).not.toContain('secureJsonData.privateKey');
  });

  it('user is visible in Credentials mode', () => {
    const ids = visibleFieldIds(credValues);
    expect(ids).toContain('jsonData.user');
  });
});

// ============================================================
// Conditional visibility — JWT mode
// ============================================================

describe('Salesforce conditional visibility (JWT mode)', () => {
  const jwtValues = { authType: 'jwt' };

  it('cert is visible in JWT mode', () => {
    const ids = visibleFieldIds(jwtValues);
    expect(ids).toContain('secureJsonData.cert');
  });

  it('privateKey is visible in JWT mode', () => {
    const ids = visibleFieldIds(jwtValues);
    expect(ids).toContain('secureJsonData.privateKey');
  });

  it('clientID is visible in JWT mode', () => {
    const ids = visibleFieldIds(jwtValues);
    expect(ids).toContain('secureJsonData.clientID');
  });

  it('password is hidden in JWT mode', () => {
    const ids = visibleFieldIds(jwtValues);
    expect(ids).not.toContain('secureJsonData.password');
  });

  it('securityToken is hidden in JWT mode', () => {
    const ids = visibleFieldIds(jwtValues);
    expect(ids).not.toContain('secureJsonData.securityToken');
  });

  it('clientSecret is hidden in JWT mode', () => {
    const ids = visibleFieldIds(jwtValues);
    expect(ids).not.toContain('secureJsonData.clientSecret');
  });

  it('user is visible in JWT mode', () => {
    const ids = visibleFieldIds(jwtValues);
    expect(ids).toContain('jsonData.user');
  });
});

// ============================================================
// Environment virtual field
// ============================================================

describe('Salesforce environment field', () => {
  it('environment is a virtual field', () => {
    const field = schema.fields.find((f) => f.id === 'environment')!;
    expect(field.kind).toBe('virtual');
  });

  it('environment uses select with production and sandbox options', () => {
    const field = schema.fields.find((f) => f.id === 'environment')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['production', 'sandbox']);
  });

  it('environment has effects that set tokenUrl and sandbox', () => {
    const field = schema.fields.find((f) => f.id === 'environment')!;
    expect(field.effects).toHaveLength(2);

    const prodEffect = field.effects!.find((e) => e.when === "value == 'production'")!;
    expect(prodEffect.set).toEqual({
      'jsonData.tokenUrl': 'https://login.salesforce.com',
      'jsonData.sandbox': false,
    });

    const sandboxEffect = field.effects!.find((e) => e.when === "value == 'sandbox'")!;
    expect(sandboxEffect.set).toEqual({
      'jsonData.tokenUrl': 'https://test.salesforce.com',
      'jsonData.sandbox': true,
    });
  });

  it('tokenUrl is managed by environment', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.tokenUrl')!;
    expect(field.tags).toContain('managed-by:environment');
  });

  it('sandbox is managed by environment', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.sandbox')!;
    expect(field.tags).toContain('managed-by:environment');
  });

  it('tokenUrl and sandbox are hidden (managed fields)', () => {
    const ids = visibleFieldIds({ authType: 'user' });
    expect(ids).not.toContain('jsonData.tokenUrl');
    expect(ids).not.toContain('jsonData.sandbox');
  });
});

// ============================================================
// UI components
// ============================================================

describe('Salesforce field UI components', () => {
  it('authType uses radio with Credentials and JWT options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.authType')!;
    expect(field.ui?.component).toBe('radio');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['user', 'jwt']);
    expect(field.ui?.options?.map((o) => o.label)).toEqual(['Credentials', 'JWT']);
  });

  it('cert uses textarea', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.cert')!;
    expect(field.ui?.component).toBe('textarea');
    expect(field.ui?.rows).toBe(7);
  });

  it('privateKey uses textarea', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.privateKey')!;
    expect(field.ui?.component).toBe('textarea');
    expect(field.ui?.rows).toBe(7);
  });

  it('enableSecureSocksProxy uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.enableSecureSocksProxy')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('password has password semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(field.semanticType).toBe('password');
  });

  it('securityToken has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.securityToken')!;
    expect(field.semanticType).toBe('token');
  });

  it('clientID has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.clientID')!;
    expect(field.semanticType).toBe('token');
  });

  it('clientSecret has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.clientSecret')!;
    expect(field.semanticType).toBe('token');
  });

  it('privateKey has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.privateKey')!;
    expect(field.semanticType).toBe('token');
  });
});

// ============================================================
// Storage targets
// ============================================================

describe('Salesforce storage targets', () => {
  it('user is stored in jsonData', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.user')!;
    expect(field.target).toBe('jsonData');
  });

  it('authType is stored in jsonData', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.authType')!;
    expect(field.target).toBe('jsonData');
  });

  it('password is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(field.target).toBe('secureJsonData');
  });

  it('all secure fields target secureJsonData', () => {
    const secureFields = schema.fields.filter((f) => f.id.startsWith('secureJsonData.'));
    expect(secureFields.length).toBeGreaterThan(0);
    for (const field of secureFields) {
      expect(field.target).toBe('secureJsonData');
    }
  });
});
