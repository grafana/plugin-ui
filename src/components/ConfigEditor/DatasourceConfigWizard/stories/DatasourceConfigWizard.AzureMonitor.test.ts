/**
 * Tests for Azure Monitor schema field visibility, groups, and conditional fields.
 *
 * Validates that the correct fields render for each auth type variant
 * using the same pure functions the wizard uses at runtime.
 */
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups, formKey, getWatchedValue } from '../config';
import { evaluateCelExpression } from '../cel';
import schemaJson from '../../../../schema/registry/grafana-azure-monitor-datasource.schema.json';

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

describe('Azure Monitor schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(16);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['auth', 'advanced']);
  });

  it('auth group has all authentication-related fields', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.azureAuthType');
    expect(auth.group.fieldRefs).toContain('jsonData.cloudName');
    expect(auth.group.fieldRefs).toContain('jsonData.tenantId');
    expect(auth.group.fieldRefs).toContain('jsonData.clientId');
    expect(auth.group.fieldRefs).toContain('secureJsonData.azureClientSecret');
  });

  it('auth group has certificate fields', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.azureCredentials.certificateFormat');
    expect(auth.group.fieldRefs).toContain('secureJsonData.clientCertificate');
    expect(auth.group.fieldRefs).toContain('secureJsonData.privateKey');
    expect(auth.group.fieldRefs).toContain('secureJsonData.certificatePassword');
  });

  it('advanced group has subscription, basic logs, timeout, cookies, and socks proxy', () => {
    const groups = resolveGroups(schema);
    const advanced = groups.find((g) => g.group.id === 'advanced')!;
    expect(advanced.group.fieldRefs).toContain('jsonData.subscriptionId');
    expect(advanced.group.fieldRefs).toContain('jsonData.basicLogsEnabled');
    expect(advanced.group.fieldRefs).toContain('jsonData.timeout');
    expect(advanced.group.fieldRefs).toContain('jsonData.keepCookies');
    expect(advanced.group.fieldRefs).toContain('jsonData.enableSecureSocksProxy');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Azure Monitor required fields', () => {
  it('azureAuthType is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.azureAuthType')!;
    expect(field.required).toBe(true);
  });

  it('tenantId is conditionally required for clientsecret', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.tenantId')!;
    expect(field.requiredWhen).toBe("jsonData.azureAuthType == 'clientsecret'");
  });

  it('clientId is conditionally required for clientsecret', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.clientId')!;
    expect(field.requiredWhen).toBe("jsonData.azureAuthType == 'clientsecret'");
  });

  it('clientSecret is conditionally required for clientsecret', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.azureClientSecret')!;
    expect(field.requiredWhen).toBe("jsonData.azureAuthType == 'clientsecret'");
  });
});

// ============================================================
// Default values
// ============================================================

describe('Azure Monitor default values', () => {
  it('azureAuthType defaults to clientsecret', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.azureAuthType')!;
    expect(field.defaultValue).toBe('clientsecret');
  });

  it('cloudName defaults to azuremonitor', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.cloudName')!;
    expect(field.defaultValue).toBe('azuremonitor');
  });
});

// ============================================================
// Conditional visibility — Client Secret
// ============================================================

describe('Azure Monitor conditional visibility (Client Secret)', () => {
  const csValues = { azureAuthType: 'clientsecret' };

  it('cloudName is visible', () => {
    expect(visibleFieldIds(csValues)).toContain('jsonData.cloudName');
  });

  it('tenantId is visible', () => {
    expect(visibleFieldIds(csValues)).toContain('jsonData.tenantId');
  });

  it('clientId is visible', () => {
    expect(visibleFieldIds(csValues)).toContain('jsonData.clientId');
  });

  it('clientSecret is visible', () => {
    expect(visibleFieldIds(csValues)).toContain('secureJsonData.azureClientSecret');
  });

  it('certificate fields are hidden', () => {
    const ids = visibleFieldIds(csValues);
    expect(ids).not.toContain('jsonData.azureCredentials.certificateFormat');
    expect(ids).not.toContain('secureJsonData.clientCertificate');
    expect(ids).not.toContain('secureJsonData.privateKey');
    expect(ids).not.toContain('secureJsonData.certificatePassword');
  });

  it('subscriptionId is always visible', () => {
    expect(visibleFieldIds(csValues)).toContain('jsonData.subscriptionId');
  });

  it('basicLogsEnabled is always visible', () => {
    expect(visibleFieldIds(csValues)).toContain('jsonData.basicLogsEnabled');
  });
});

// ============================================================
// Conditional visibility — Client Certificate
// ============================================================

describe('Azure Monitor conditional visibility (Client Certificate)', () => {
  const certValues = { azureAuthType: 'clientcertificate' };

  it('cloudName is visible', () => {
    expect(visibleFieldIds(certValues)).toContain('jsonData.cloudName');
  });

  it('tenantId is visible', () => {
    expect(visibleFieldIds(certValues)).toContain('jsonData.tenantId');
  });

  it('clientId is visible', () => {
    expect(visibleFieldIds(certValues)).toContain('jsonData.clientId');
  });

  it('certificateFormat is visible', () => {
    expect(visibleFieldIds(certValues)).toContain('jsonData.azureCredentials.certificateFormat');
  });

  it('clientCertificate is visible', () => {
    expect(visibleFieldIds(certValues)).toContain('secureJsonData.clientCertificate');
  });

  it('privateKey is visible', () => {
    expect(visibleFieldIds(certValues)).toContain('secureJsonData.privateKey');
  });

  it('certificatePassword is visible', () => {
    expect(visibleFieldIds(certValues)).toContain('secureJsonData.certificatePassword');
  });

  it('clientSecret is hidden', () => {
    expect(visibleFieldIds(certValues)).not.toContain('secureJsonData.azureClientSecret');
  });
});

// ============================================================
// Conditional visibility — Managed Identity
// ============================================================

describe('Azure Monitor conditional visibility (Managed Identity)', () => {
  const msiValues = { azureAuthType: 'msi' };

  it('cloudName is hidden', () => {
    expect(visibleFieldIds(msiValues)).not.toContain('jsonData.cloudName');
  });

  it('tenantId is hidden', () => {
    expect(visibleFieldIds(msiValues)).not.toContain('jsonData.tenantId');
  });

  it('clientId is hidden', () => {
    expect(visibleFieldIds(msiValues)).not.toContain('jsonData.clientId');
  });

  it('clientSecret is hidden', () => {
    expect(visibleFieldIds(msiValues)).not.toContain('secureJsonData.azureClientSecret');
  });

  it('certificate fields are hidden', () => {
    const ids = visibleFieldIds(msiValues);
    expect(ids).not.toContain('jsonData.azureCredentials.certificateFormat');
    expect(ids).not.toContain('secureJsonData.clientCertificate');
    expect(ids).not.toContain('secureJsonData.privateKey');
    expect(ids).not.toContain('secureJsonData.certificatePassword');
  });

  it('subscriptionId is visible', () => {
    expect(visibleFieldIds(msiValues)).toContain('jsonData.subscriptionId');
  });

  it('basicLogsEnabled is visible', () => {
    expect(visibleFieldIds(msiValues)).toContain('jsonData.basicLogsEnabled');
  });
});

// ============================================================
// Conditional visibility — Workload Identity
// ============================================================

describe('Azure Monitor conditional visibility (Workload Identity)', () => {
  const wliValues = { azureAuthType: 'workloadidentity' };

  it('cloudName is hidden', () => {
    expect(visibleFieldIds(wliValues)).not.toContain('jsonData.cloudName');
  });

  it('tenantId is hidden', () => {
    expect(visibleFieldIds(wliValues)).not.toContain('jsonData.tenantId');
  });

  it('clientSecret is hidden', () => {
    expect(visibleFieldIds(wliValues)).not.toContain('secureJsonData.azureClientSecret');
  });

  it('subscriptionId is visible', () => {
    expect(visibleFieldIds(wliValues)).toContain('jsonData.subscriptionId');
  });
});

// ============================================================
// Managed fields (hidden from UI)
// ============================================================

describe('Azure Monitor managed fields', () => {
  it('azureCredentials object is managed and hidden', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.azureCredentials')!;
    expect(field.tags).toContain('managed-by:jsonData.azureAuthType');
  });

  it('oauthPassThru is managed and hidden', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.oauthPassThru')!;
    expect(field.tags).toContain('managed-by:jsonData.azureAuthType');
  });

  it('managed fields are hidden from visible fields', () => {
    const ids = visibleFieldIds({ azureAuthType: 'clientsecret' });
    expect(ids).not.toContain('jsonData.azureCredentials');
    expect(ids).not.toContain('jsonData.oauthPassThru');
  });
});

// ============================================================
// UI components
// ============================================================

describe('Azure Monitor field UI components', () => {
  it('azureAuthType uses select with all auth options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.azureAuthType')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual([
      'currentuser',
      'clientsecret',
      'clientcertificate',
      'msi',
      'workloadidentity',
      'ad-password',
    ]);
  });

  it('cloudName uses select with Azure cloud options', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.cloudName')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['azuremonitor', 'chinaazuremonitor', 'govazuremonitor']);
  });

  it('certificateFormat uses select with PEM and PFX', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.azureCredentials.certificateFormat')!;
    expect(field.ui?.component).toBe('select');
    expect(field.ui?.options?.map((o) => o.value)).toEqual(['pem', 'pfx']);
  });

  it('clientCertificate uses textarea', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.clientCertificate')!;
    expect(field.ui?.component).toBe('textarea');
    expect(field.ui?.rows).toBe(7);
  });

  it('privateKey uses textarea', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.privateKey')!;
    expect(field.ui?.component).toBe('textarea');
    expect(field.ui?.rows).toBe(7);
  });

  it('basicLogsEnabled uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.basicLogsEnabled')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('enableSecureSocksProxy uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.enableSecureSocksProxy')!;
    expect(field.ui?.component).toBe('switch');
  });

  it('clientSecret has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.azureClientSecret')!;
    expect(field.semanticType).toBe('token');
  });

  it('certificatePassword has password semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.certificatePassword')!;
    expect(field.semanticType).toBe('password');
  });
});

// ============================================================
// Schema metadata
// ============================================================

describe('Azure Monitor schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-azure-monitor-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Azure Monitor');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/grafana/latest/datasources/azure-monitor/configure');
  });
});
