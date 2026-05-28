/**
 * Tests for LogicMonitor schema field structure, groups, and field properties.
 *
 * Validates that the correct fields render for the LogicMonitor configuration
 * using the same pure functions the wizard uses at runtime.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import logicMonitorSchemaJson from '../../../../schema/registry/grafana-logicmonitor-datasource.schema.json';

const schema = logicMonitorSchemaJson as unknown as DatasourceConfigSchema;

// ============================================================
// Schema structure
// ============================================================

describe('LogicMonitor schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(2);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth']);
  });

  it('connection group has account_name', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('jsonData.variables.account_name');
  });

  it('auth group has bearer token', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('secureJsonData.logicmonitor.token');
  });
});

// ============================================================
// Required fields
// ============================================================

describe('LogicMonitor required fields', () => {
  it('account_name is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.account_name')!;
    expect(field.required).toBe(true);
  });

  it('token is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.logicmonitor.token')!;
    expect(field.required).toBe(true);
  });
});

// ============================================================
// Field properties
// ============================================================

describe('LogicMonitor field properties', () => {
  it('account_name is stored in jsonData with variables section', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.account_name')!;
    expect(field.target).toBe('jsonData');
    expect(field.section).toBe('variables');
    expect(field.key).toBe('account_name');
  });

  it('token is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.logicmonitor.token')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('logicmonitor.token');
  });

  it('token has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.logicmonitor.token')!;
    expect(field.semanticType).toBe('token');
  });

  it('account_name has correct label', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.account_name')!;
    expect(field.label).toBe('Account Name');
  });

  it('token has correct label and placeholder', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.logicmonitor.token')!;
    expect(field.label).toBe('Token');
    expect(field.ui?.placeholder).toBe('Token value');
  });
});

// ============================================================
// No conditional visibility (simple config)
// ============================================================

describe('LogicMonitor has no conditional fields', () => {
  it('no fields have dependsOn', () => {
    const fieldsWithDependsOn = schema.fields.filter((f) => f.dependsOn);
    expect(fieldsWithDependsOn).toHaveLength(0);
  });

  it('all fields are always visible', () => {
    const visibleFields = schema.fields.filter((f) => !f.tags?.some((t) => t.startsWith('managed-by:')));
    expect(visibleFields).toHaveLength(2);
  });
});

// ============================================================
// Schema metadata
// ============================================================

describe('LogicMonitor schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-logicmonitor-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('LogicMonitor Devices');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-logicmonitor-datasource');
  });
});
