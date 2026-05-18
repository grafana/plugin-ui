/**
 * Tests for InfluxDB schema field visibility, groups, conditional fields,
 * auth method effects, and product-dependent query language overrides.
 *
 * These validate that the correct fields render for each query-language mode
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../datasource/schema/schema';
import {
  resolveGroups,
  formKey,
  getWatchedValue,
  computeVirtualFieldValues,
} from '../../../../datasource/schema/config';
import { evaluateCelExpression } from '../../../../datasource/schema/cel';
import { evaluateEffectCondition } from '../fieldUtils';
import influxdbSchemaJson from '../../../../datasource/schema/datasources/influxdb.schema.json';

const schema = influxdbSchemaJson as unknown as DatasourceConfigSchema;

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

function applyEffects(
  field: ConfigField,
  fieldValue: unknown,
  values: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...values };
  const fieldById = buildFieldMap();
  if (!field.effects) {
    return result;
  }
  for (const eff of field.effects) {
    if (evaluateEffectCondition(eff.when, fieldValue)) {
      for (const [targetId, val] of Object.entries(eff.set)) {
        const targetField = fieldById.get(targetId);
        const key = targetField ? formKey(targetField) : targetId;
        result[key] = val;
      }
      break;
    }
  }
  return result;
}

// ============================================================
// Schema structure
// ============================================================

describe('InfluxDB schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(31);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth', 'tls', 'database-settings']);
  });

  it('connection group has URL, product, version, and HTTP fields', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('root.url');
    expect(conn.group.fieldRefs).toContain('jsonData.product');
    expect(conn.group.fieldRefs).toContain('jsonData.version');
    expect(conn.group.fieldRefs).toContain('jsonData.keepCookies');
    expect(conn.group.fieldRefs).toContain('jsonData.timeout');
    expect(conn.group.fieldRefs).toContain('httpHeaders');
    expect(conn.group.fieldRefs).toContain('jsonData.pdcInjected');
  });

  it('auth group has authentication method and basic auth fields', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('auth.method');
    expect(auth.group.fieldRefs).toContain('root.basicAuth');
    expect(auth.group.fieldRefs).toContain('root.basicAuthUser');
    expect(auth.group.fieldRefs).toContain('secureJsonData.basicAuthPassword');
    expect(auth.group.fieldRefs).toContain('jsonData.oauthPassThru');
  });

  it('tls group has TLS switches and conditional cert fields', () => {
    const groups = resolveGroups(schema);
    const tls = groups.find((g) => g.group.id === 'tls')!;
    expect(tls.group.fieldRefs).toContain('jsonData.tlsAuth');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsAuthWithCACert');
    expect(tls.group.fieldRefs).toContain('jsonData.tlsSkipVerify');
    expect(tls.group.fieldRefs).toContain('secureJsonData.tlsClientCert');
    expect(tls.group.fieldRefs).toContain('secureJsonData.tlsClientKey');
    expect(tls.group.fieldRefs).toContain('secureJsonData.tlsCACert');
    expect(tls.group.fieldRefs).toContain('jsonData.serverName');
  });

  it('database-settings group has all database-related fields', () => {
    const groups = resolveGroups(schema);
    const db = groups.find((g) => g.group.id === 'database-settings')!;
    expect(db.group.fieldRefs).toContain('jsonData.dbName');
    expect(db.group.fieldRefs).toContain('root.user');
    expect(db.group.fieldRefs).toContain('secureJsonData.password');
    expect(db.group.fieldRefs).toContain('secureJsonData.token');
    expect(db.group.fieldRefs).toContain('jsonData.organization');
    expect(db.group.fieldRefs).toContain('jsonData.defaultBucket');
    expect(db.group.fieldRefs).toContain('jsonData.httpMode');
    expect(db.group.fieldRefs).toContain('jsonData.timeInterval');
    expect(db.group.fieldRefs).toContain('jsonData.showTagTime');
    expect(db.group.fieldRefs).toContain('jsonData.maxSeries');
    expect(db.group.fieldRefs).toContain('jsonData.insecureGrpc');
    expect(db.group.fieldRefs).toContain('jsonData.metadata');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('InfluxDB required fields', () => {
  it('URL is always required', () => {
    const f = schema.fields.find((f) => f.id === 'root.url')!;
    expect(f.required).toBe(true);
  });

  it('product is optional (v1 compat)', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.product')!;
    expect(f.required).toBeUndefined();
  });

  it('query language (version) is required', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.version')!;
    expect(f.required).toBe(true);
  });

  it('organization is required when Flux', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.organization')!;
    expect(f.requiredWhen).toBe("jsonData.version == 'Flux'");
  });

  it('defaultBucket is required when Flux', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.defaultBucket')!;
    expect(f.requiredWhen).toBe("jsonData.version == 'Flux'");
  });

  it('user is required when InfluxQL', () => {
    const f = schema.fields.find((f) => f.id === 'root.user')!;
    expect(f.requiredWhen).toBe("jsonData.version == 'InfluxQL'");
  });

  it('password is required when InfluxQL', () => {
    const f = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(f.requiredWhen).toBe("jsonData.version == 'InfluxQL'");
  });
});

// ============================================================
// Default values
// ============================================================

describe('InfluxDB default values', () => {
  it('maxSeries defaults to 1000', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.maxSeries')!;
    expect(f.defaultValue).toBe(1000);
  });

  it('timeInterval defaults to 10s', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.timeInterval')!;
    expect(f.defaultValue).toBe('10s');
  });

  it('httpMode defaults to GET', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.httpMode')!;
    expect(f.defaultValue).toBe('GET');
  });

  it('auth.method defaults to no-auth', () => {
    const f = schema.fields.find((f) => f.id === 'auth.method')!;
    expect(f.defaultValue).toBe('no-auth');
  });
});

// ============================================================
// UI components
// ============================================================

describe('InfluxDB field UI components', () => {
  it('TLS toggles use switch', () => {
    for (const id of ['jsonData.tlsAuth', 'jsonData.tlsAuthWithCACert', 'jsonData.tlsSkipVerify']) {
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

  it('token has token semantic type', () => {
    const f = schema.fields.find((f) => f.id === 'secureJsonData.token')!;
    expect(f.semanticType).toBe('token');
  });

  it('password has password semantic type', () => {
    const f = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    expect(f.semanticType).toBe('password');
  });

  it('insecureGrpc uses switch', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.insecureGrpc')!;
    expect(f.ui?.component).toBe('switch');
  });

  it('pdcInjected uses switch', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.pdcInjected')!;
    expect(f.ui?.component).toBe('switch');
  });

  it('product uses select', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.product')!;
    expect(f.ui?.component).toBe('select');
    expect(f.ui?.options).toHaveLength(10);
  });

  it('version uses select with 3 base options', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.version')!;
    expect(f.ui?.component).toBe('select');
    expect(f.ui?.options).toHaveLength(3);
  });
});

// ============================================================
// InfluxQL mode
// ============================================================

describe('InfluxDB InfluxQL mode', () => {
  const values: Record<string, unknown> = {
    version: 'InfluxQL',
    authMethod: 'no-auth',
  };

  it('shows InfluxQL-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.user');
    expect(ids).toContain('secureJsonData.password');
    expect(ids).toContain('jsonData.httpMode');
    expect(ids).toContain('jsonData.showTagTime');
  });

  it('hides Flux-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.organization');
    expect(ids).not.toContain('jsonData.defaultBucket');
  });

  it('hides SQL-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.insecureGrpc');
    expect(ids).not.toContain('jsonData.metadata');
  });

  it('hides token (not used in InfluxQL)', () => {
    expect(visibleFieldIds(values)).not.toContain('secureJsonData.token');
  });

  it('shows always-visible fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.url');
    expect(ids).toContain('jsonData.dbName');
    expect(ids).toContain('jsonData.timeInterval');
    expect(ids).toContain('jsonData.maxSeries');
  });
});

// ============================================================
// Flux mode
// ============================================================

describe('InfluxDB Flux mode', () => {
  const values: Record<string, unknown> = {
    version: 'Flux',
    authMethod: 'no-auth',
  };

  it('shows Flux-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.organization');
    expect(ids).toContain('jsonData.defaultBucket');
    expect(ids).toContain('secureJsonData.token');
  });

  it('hides InfluxQL-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('root.user');
    expect(ids).not.toContain('secureJsonData.password');
    expect(ids).not.toContain('jsonData.httpMode');
    expect(ids).not.toContain('jsonData.showTagTime');
  });

  it('hides SQL-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.insecureGrpc');
    expect(ids).not.toContain('jsonData.metadata');
  });

  it('shows always-visible fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.url');
    expect(ids).toContain('jsonData.dbName');
    expect(ids).toContain('jsonData.timeInterval');
    expect(ids).toContain('jsonData.maxSeries');
  });
});

// ============================================================
// SQL mode
// ============================================================

describe('InfluxDB SQL mode', () => {
  const values: Record<string, unknown> = {
    version: 'SQL',
    authMethod: 'no-auth',
  };

  it('shows SQL-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.insecureGrpc');
    expect(ids).toContain('jsonData.metadata');
    expect(ids).toContain('secureJsonData.token');
  });

  it('hides InfluxQL-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('root.user');
    expect(ids).not.toContain('secureJsonData.password');
    expect(ids).not.toContain('jsonData.httpMode');
    expect(ids).not.toContain('jsonData.showTagTime');
  });

  it('hides Flux-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.organization');
    expect(ids).not.toContain('jsonData.defaultBucket');
  });

  it('shows always-visible fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.url');
    expect(ids).toContain('jsonData.dbName');
    expect(ids).toContain('jsonData.timeInterval');
    expect(ids).toContain('jsonData.maxSeries');
  });
});

// ============================================================
// Fresh state (no version set)
// ============================================================

describe('InfluxDB fresh state (no version)', () => {
  const values: Record<string, unknown> = {};

  it('shows URL and product', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.url');
    expect(ids).toContain('jsonData.product');
    expect(ids).toContain('jsonData.version');
  });

  it('hides all mode-specific fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('root.user');
    expect(ids).not.toContain('secureJsonData.password');
    expect(ids).not.toContain('jsonData.httpMode');
    expect(ids).not.toContain('jsonData.showTagTime');
    expect(ids).not.toContain('jsonData.organization');
    expect(ids).not.toContain('jsonData.defaultBucket');
    expect(ids).not.toContain('jsonData.insecureGrpc');
    expect(ids).not.toContain('jsonData.metadata');
    expect(ids).not.toContain('secureJsonData.token');
  });

  it('shows always-visible fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.dbName');
    expect(ids).toContain('jsonData.timeInterval');
    expect(ids).toContain('jsonData.maxSeries');
  });
});

// ============================================================
// v1 compat (no product, just version)
// ============================================================

describe('InfluxDB v1 compat — InfluxQL without product', () => {
  const values: Record<string, unknown> = {
    version: 'InfluxQL',
  };

  it('shows InfluxQL-specific fields even without product', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('root.user');
    expect(ids).toContain('secureJsonData.password');
    expect(ids).toContain('jsonData.httpMode');
    expect(ids).toContain('jsonData.showTagTime');
  });

  it('hides Flux and SQL fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('jsonData.organization');
    expect(ids).not.toContain('jsonData.defaultBucket');
    expect(ids).not.toContain('jsonData.insecureGrpc');
    expect(ids).not.toContain('secureJsonData.token');
  });
});

describe('InfluxDB v1 compat — Flux without product', () => {
  const values: Record<string, unknown> = {
    version: 'Flux',
  };

  it('shows Flux-specific fields even without product', () => {
    const ids = visibleFieldIds(values);
    expect(ids).toContain('jsonData.organization');
    expect(ids).toContain('jsonData.defaultBucket');
    expect(ids).toContain('secureJsonData.token');
  });

  it('hides InfluxQL and SQL fields', () => {
    const ids = visibleFieldIds(values);
    expect(ids).not.toContain('root.user');
    expect(ids).not.toContain('secureJsonData.password');
    expect(ids).not.toContain('jsonData.httpMode');
    expect(ids).not.toContain('jsonData.insecureGrpc');
  });
});

// ============================================================
// Auth method effects
// ============================================================

describe('InfluxDB auth.method effects', () => {
  const authField = schema.fields.find((f) => f.id === 'auth.method')!;

  it('auth.method is a virtual field with computed storage', () => {
    expect(authField.kind).toBe('virtual');
    expect(authField.storage).toBeDefined();
    expect(authField.storage!.type).toBe('computed');
  });

  it('no-auth disables basicAuth and oauthPassThru', () => {
    const values = applyEffects(authField, 'no-auth', { authMethod: 'no-auth' });
    expect(values['basicAuth']).toBe(false);
    expect(values['oauthPassThru']).toBe(false);
  });

  it('basic-auth enables basicAuth and disables oauthPassThru', () => {
    const values = applyEffects(authField, 'basic-auth', { authMethod: 'basic-auth' });
    expect(values['basicAuth']).toBe(true);
    expect(values['oauthPassThru']).toBe(false);
  });

  it('forward-oauth disables basicAuth and enables oauthPassThru', () => {
    const values = applyEffects(authField, 'forward-oauth', { authMethod: 'forward-oauth' });
    expect(values['basicAuth']).toBe(false);
    expect(values['oauthPassThru']).toBe(true);
  });
});

// ============================================================
// Basic auth field visibility
// ============================================================

describe('InfluxDB basic auth visibility', () => {
  it('username visible when basic-auth selected', () => {
    const ids = visibleFieldIds({ authMethod: 'basic-auth', version: 'Flux' });
    expect(ids).toContain('root.basicAuthUser');
    expect(ids).toContain('secureJsonData.basicAuthPassword');
  });

  it('username hidden when no-auth selected', () => {
    const ids = visibleFieldIds({ authMethod: 'no-auth', version: 'Flux' });
    expect(ids).not.toContain('root.basicAuthUser');
    expect(ids).not.toContain('secureJsonData.basicAuthPassword');
  });

  it('managed-by:auth.method fields are hidden from direct rendering', () => {
    const basicAuthField = schema.fields.find((f) => f.id === 'root.basicAuth')!;
    expect(basicAuthField.tags).toContain('managed-by:auth.method');
    const ids = visibleFieldIds({ authMethod: 'basic-auth', version: 'Flux' });
    expect(ids).not.toContain('root.basicAuth');
    expect(ids).not.toContain('jsonData.oauthPassThru');
  });
});

// ============================================================
// Product-dependent query language overrides
// ============================================================

describe('InfluxDB product → version overrides', () => {
  const versionField = schema.fields.find((f) => f.id === 'jsonData.version')!;

  it('has 4 product-specific overrides', () => {
    expect(versionField.overrides).toHaveLength(4);
  });

  it('InfluxDB Cloud Dedicated restricts to SQL and InfluxQL', () => {
    const override = versionField.overrides!.find((o) => o.when.includes("'InfluxDB Cloud Dedicated'"))!;
    const optionValues = override.options!.map((o) => o.value);
    expect(optionValues).toEqual(['SQL', 'InfluxQL']);
    expect(optionValues).not.toContain('Flux');
  });

  it('InfluxDB Cloud Serverless allows SQL, InfluxQL, and Flux', () => {
    const override = versionField.overrides!.find((o) => o.when.includes("'InfluxDB Cloud Serverless'"))!;
    const optionValues = override.options!.map((o) => o.value);
    expect(optionValues).toEqual(['SQL', 'InfluxQL', 'Flux']);
  });

  it('InfluxDB OSS 1.x/2.x and Enterprise 1.x restrict to InfluxQL and Flux', () => {
    const override = versionField.overrides!.find((o) => o.when.includes("'InfluxDB OSS 1.x'"))!;
    const optionValues = override.options!.map((o) => o.value);
    expect(optionValues).toEqual(['InfluxQL', 'Flux']);
    expect(optionValues).not.toContain('SQL');
  });

  it('InfluxDB Cloud 1 restricts to InfluxQL only', () => {
    const override = versionField.overrides!.find((o) => o.when.includes("'InfluxDB Cloud 1'"))!;
    const optionValues = override.options!.map((o) => o.value);
    expect(optionValues).toEqual(['InfluxQL']);
  });

  it('each override has matching allowedValues validation', () => {
    for (const override of versionField.overrides!) {
      const optionValues = override.options!.map((o) => o.value);
      const validation = override.validations!.find((v) => v.type === 'allowedValues');
      expect(validation).toBeDefined();
      expect((validation as { values: unknown[] }).values).toEqual(optionValues);
    }
  });
});

// ============================================================
// Product → version override CEL evaluation
// ============================================================

describe('InfluxDB product override CEL conditions', () => {
  const versionField = schema.fields.find((f) => f.id === 'jsonData.version')!;

  function matchingOverride(productValue: string) {
    const celCtx = { jsonData: { product: productValue } };
    return versionField.overrides!.find((o) => evaluateCelExpression(o.when, celCtx));
  }

  function allowedVersions(productValue: string): string[] {
    const ov = matchingOverride(productValue);
    return ov ? ov.options!.map((o) => o.value as string) : versionField.ui!.options!.map((o) => o.value as string);
  }

  // v3 / Dedicated products → SQL + InfluxQL only
  it.each(['InfluxDB Cloud Dedicated', 'InfluxDB Clustered', 'InfluxDB Enterprise 3.x', 'InfluxDB OSS 3.x'])(
    '%s restricts to SQL and InfluxQL',
    (product) => {
      expect(allowedVersions(product)).toEqual(['SQL', 'InfluxQL']);
    }
  );

  // Cloud Serverless → all three
  it('InfluxDB Cloud Serverless allows all query languages', () => {
    expect(allowedVersions('InfluxDB Cloud Serverless')).toEqual(['SQL', 'InfluxQL', 'Flux']);
  });

  // Legacy v1/v2 products → InfluxQL + Flux
  it.each(['InfluxDB Cloud (TSM)', 'InfluxDB OSS 1.x', 'InfluxDB OSS 2.x', 'InfluxDB Enterprise 1.x'])(
    '%s restricts to InfluxQL and Flux',
    (product) => {
      expect(allowedVersions(product)).toEqual(['InfluxQL', 'Flux']);
    }
  );

  // Cloud 1 → InfluxQL only
  it('InfluxDB Cloud 1 restricts to InfluxQL only', () => {
    expect(allowedVersions('InfluxDB Cloud 1')).toEqual(['InfluxQL']);
  });

  // No product (v1 compat) → all three base options
  it('no product set falls through to base options (all 3)', () => {
    const ov = matchingOverride('');
    expect(ov).toBeUndefined();
    expect(allowedVersions('')).toEqual(['SQL', 'InfluxQL', 'Flux']);
  });

  // Every product in the select options matches exactly one override
  it('every product option maps to exactly one override', () => {
    const productField = schema.fields.find((f) => f.id === 'jsonData.product')!;
    for (const opt of productField.ui!.options!) {
      const product = opt.value as string;
      const matches = versionField.overrides!.filter((o) => {
        const celCtx = { jsonData: { product } };
        return evaluateCelExpression(o.when, celCtx);
      });
      expect(matches).toHaveLength(1);
    }
  });
});

// ============================================================
// Product does not affect field visibility (frontend-only)
// ============================================================

describe('InfluxDB product has no effect on field visibility', () => {
  it('product field has no dependsOn', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.product')!;
    expect(f.dependsOn).toBeUndefined();
  });

  it('product field has no effects', () => {
    const f = schema.fields.find((f) => f.id === 'jsonData.product')!;
    expect(f.effects).toBeUndefined();
  });

  it('no field uses dependsOn referencing product', () => {
    for (const field of schema.fields) {
      if (field.dependsOn) {
        expect(field.dependsOn).not.toContain('jsonData.product');
      }
    }
  });

  it('same fields visible regardless of product when version is the same', () => {
    const withProduct = visibleFieldIds({ product: 'InfluxDB OSS 2.x', version: 'Flux' });
    const withoutProduct = visibleFieldIds({ version: 'Flux' });
    expect(withProduct).toEqual(withoutProduct);
  });
});

// ============================================================
// Version → backend field alignment
// ============================================================

describe('InfluxDB version → backend field alignment', () => {
  // Backend reads Token from DecryptedSecureJSONData["token"] for Flux/SQL
  it('token visible for Flux and SQL only (matches backend)', () => {
    expect(visibleFieldIds({ version: 'Flux' })).toContain('secureJsonData.token');
    expect(visibleFieldIds({ version: 'SQL' })).toContain('secureJsonData.token');
    expect(visibleFieldIds({ version: 'InfluxQL' })).not.toContain('secureJsonData.token');
    expect(visibleFieldIds({})).not.toContain('secureJsonData.token');
  });

  // Backend reads DbName for all modes but it's only meaningful for InfluxQL/SQL
  it('dbName always visible (backend uses it for InfluxQL and SQL)', () => {
    expect(visibleFieldIds({ version: 'InfluxQL' })).toContain('jsonData.dbName');
    expect(visibleFieldIds({ version: 'SQL' })).toContain('jsonData.dbName');
    expect(visibleFieldIds({ version: 'Flux' })).toContain('jsonData.dbName');
  });

  // Backend reads Organization and DefaultBucket only for Flux
  it('organization and defaultBucket visible only for Flux (matches backend)', () => {
    expect(visibleFieldIds({ version: 'Flux' })).toContain('jsonData.organization');
    expect(visibleFieldIds({ version: 'Flux' })).toContain('jsonData.defaultBucket');
    expect(visibleFieldIds({ version: 'InfluxQL' })).not.toContain('jsonData.organization');
    expect(visibleFieldIds({ version: 'SQL' })).not.toContain('jsonData.organization');
  });

  // Backend reads InsecureGrpc only for SQL (FlightSQL)
  it('insecureGrpc visible only for SQL (matches backend)', () => {
    expect(visibleFieldIds({ version: 'SQL' })).toContain('jsonData.insecureGrpc');
    expect(visibleFieldIds({ version: 'InfluxQL' })).not.toContain('jsonData.insecureGrpc');
    expect(visibleFieldIds({ version: 'Flux' })).not.toContain('jsonData.insecureGrpc');
  });

  // Backend reads HTTPMode only for InfluxQL
  it('httpMode visible only for InfluxQL (matches backend)', () => {
    expect(visibleFieldIds({ version: 'InfluxQL' })).toContain('jsonData.httpMode');
    expect(visibleFieldIds({ version: 'Flux' })).not.toContain('jsonData.httpMode');
    expect(visibleFieldIds({ version: 'SQL' })).not.toContain('jsonData.httpMode');
  });

  // Backend uses root.user (InfluxQL u= param) — separate from basicAuthUser
  it('root.user (InfluxQL credentials) separate from basicAuthUser (HTTP auth)', () => {
    const userField = schema.fields.find((f) => f.id === 'root.user')!;
    const basicAuthUserField = schema.fields.find((f) => f.id === 'root.basicAuthUser')!;
    // Different targets/keys
    expect(userField.key).toBe('user');
    expect(basicAuthUserField.key).toBe('basicAuthUser');
    // Different visibility conditions
    expect(userField.dependsOn).toBe("jsonData.version == 'InfluxQL'");
    expect(basicAuthUserField.dependsOn).toBe("auth.method == 'basic-auth'");
  });

  // secureJsonData.password (InfluxQL) separate from secureJsonData.basicAuthPassword (HTTP auth)
  it('secureJsonData.password (InfluxQL) separate from basicAuthPassword (HTTP auth)', () => {
    const pwField = schema.fields.find((f) => f.id === 'secureJsonData.password')!;
    const basicPwField = schema.fields.find((f) => f.id === 'secureJsonData.basicAuthPassword')!;
    expect(pwField.key).toBe('password');
    expect(basicPwField.key).toBe('basicAuthPassword');
    expect(pwField.dependsOn).toBe("jsonData.version == 'InfluxQL'");
    expect(basicPwField.dependsOn).toBe("auth.method == 'basic-auth'");
  });

  // timeInterval and maxSeries are always visible (backend reads for all modes)
  it('timeInterval and maxSeries always visible (backend reads for all modes)', () => {
    for (const version of ['InfluxQL', 'Flux', 'SQL']) {
      const ids = visibleFieldIds({ version });
      expect(ids).toContain('jsonData.timeInterval');
      expect(ids).toContain('jsonData.maxSeries');
    }
  });
});

// ============================================================
// TLS field visibility
// ============================================================

describe('InfluxDB TLS field visibility', () => {
  it('hides client cert fields when TLS client auth disabled', () => {
    const ids = visibleFieldIds({ version: 'Flux', tlsAuth: false, tlsAuthWithCACert: false });
    expect(ids).not.toContain('secureJsonData.tlsClientCert');
    expect(ids).not.toContain('secureJsonData.tlsClientKey');
    expect(ids).not.toContain('jsonData.serverName');
    expect(ids).not.toContain('secureJsonData.tlsCACert');
  });

  it('shows client cert fields when TLS client auth enabled', () => {
    const ids = visibleFieldIds({ version: 'Flux', tlsAuth: true });
    expect(ids).toContain('secureJsonData.tlsClientCert');
    expect(ids).toContain('secureJsonData.tlsClientKey');
    expect(ids).toContain('jsonData.serverName');
  });

  it('shows CA cert when tlsAuthWithCACert enabled', () => {
    const ids = visibleFieldIds({ version: 'Flux', tlsAuthWithCACert: true });
    expect(ids).toContain('secureJsonData.tlsCACert');
  });

  it('hides CA cert when tlsAuthWithCACert disabled', () => {
    const ids = visibleFieldIds({ version: 'Flux', tlsAuthWithCACert: false });
    expect(ids).not.toContain('secureJsonData.tlsCACert');
  });

  it('TLS toggles are always visible', () => {
    const ids = visibleFieldIds({ version: 'Flux' });
    expect(ids).toContain('jsonData.tlsAuth');
    expect(ids).toContain('jsonData.tlsAuthWithCACert');
    expect(ids).toContain('jsonData.tlsSkipVerify');
  });
});

// ============================================================
// Computed virtual field: auth.method
// ============================================================

describe('InfluxDB auth.method computed storage', () => {
  const authField = schema.fields.find((f) => f.id === 'auth.method')!;

  it('has a computed storage read expression', () => {
    expect(authField.storage).toBeDefined();
    expect(authField.storage!.type).toBe('computed');
    expect((authField.storage as { read: string }).read).toContain('basic-auth');
    expect((authField.storage as { read: string }).read).toContain('forward-oauth');
    expect((authField.storage as { read: string }).read).toContain('no-auth');
  });

  it('root.basicAuth == true evaluates correctly', () => {
    expect(evaluateCelExpression('root.basicAuth == true', { root: { basicAuth: true } })).toBe(true);
    expect(evaluateCelExpression('root.basicAuth == true', { root: { basicAuth: false } })).toBe(false);
  });

  it('jsonData.oauthPassThru == true evaluates correctly', () => {
    expect(evaluateCelExpression('jsonData.oauthPassThru == true', { jsonData: { oauthPassThru: true } })).toBe(true);
    expect(evaluateCelExpression('jsonData.oauthPassThru == true', { jsonData: { oauthPassThru: false } })).toBe(false);
  });
});
