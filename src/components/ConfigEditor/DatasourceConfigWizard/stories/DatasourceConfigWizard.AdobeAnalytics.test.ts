/**
 * Tests for Adobe Analytics schema field visibility, groups, and field properties.
 *
 * Validates that the correct fields render for the OAuth2 client credentials
 * configuration using the same pure functions the wizard uses at runtime.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import adobeAnalyticsSchemaJson from '../../../../schema/registry/grafana-adobeanalytics-datasource.schema.json';

const schema = adobeAnalyticsSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Schema structure
// ============================================================

describe('Adobe Analytics schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(4);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth', 'advanced']);
  });

  it('connection group has global_company_id', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('jsonData.variables.global_company_id');
  });

  it('auth group has clientId and clientSecret', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.services.adobe_analytics.auth.clientId');
    expect(auth.group.fieldRefs).toContain('secureJsonData.adobe_analytics.clientSecret');
  });

  it('auth group description mentions OAuth token URL', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.description).toContain('ims-na1.adobelogin.com');
  });

  it('advanced group has enableSecureSocksProxy', () => {
    const groups = resolveGroups(schema);
    const advanced = groups.find((g) => g.group.id === 'advanced')!;
    expect(advanced.group.fieldRefs).toContain('jsonData.enableSecureSocksProxy');
  });

  it('advanced group is optional', () => {
    const groups = resolveGroups(schema);
    const advanced = groups.find((g) => g.group.id === 'advanced')!;
    expect(advanced.group.optional).toBe(true);
  });
});

// ============================================================
// Required fields
// ============================================================

describe('Adobe Analytics required fields', () => {
  it('global_company_id is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.global_company_id')!;
    expect(field.required).toBe(true);
  });

  it('clientId is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.services.adobe_analytics.auth.clientId')!;
    expect(field.required).toBe(true);
  });

  it('clientSecret is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.adobe_analytics.clientSecret')!;
    expect(field.required).toBe(true);
  });

  it('enableSecureSocksProxy is not required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.enableSecureSocksProxy')!;
    expect(field.required).toBeUndefined();
  });
});

// ============================================================
// Field targets
// ============================================================

describe('Adobe Analytics field targets', () => {
  it('global_company_id targets jsonData with variables section', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.global_company_id')!;
    expect(field.target).toBe('jsonData');
    expect(field.section).toBe('variables');
  });

  it('clientId targets jsonData', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.services.adobe_analytics.auth.clientId')!;
    expect(field.target).toBe('jsonData');
  });

  it('clientSecret targets secureJsonData with token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.adobe_analytics.clientSecret')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.semanticType).toBe('token');
  });
});

// ============================================================
// UI components
// ============================================================

describe('Adobe Analytics field UI components', () => {
  it('enableSecureSocksProxy uses switch', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.enableSecureSocksProxy')!;
    expect(field.ui?.component).toBe('switch');
  });
});

// ============================================================
// Plugin metadata
// ============================================================

describe('Adobe Analytics plugin metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-adobeanalytics-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Adobe Analytics');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toContain('grafana-adobeanalytics-datasource');
  });
});
