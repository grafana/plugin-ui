/**
 * Tests for Zendesk schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-zendesk-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Zendesk schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(3);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth']);
  });

  it('connection group has subdomain', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('jsonData.variables.subdomain');
  });

  it('auth group has email and api token', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.services.zendesk.auth.username');
    expect(auth.group.fieldRefs).toContain('secureJsonData.zendesk.password');
  });
});

describe('Zendesk required fields', () => {
  it('subdomain is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.subdomain')!;
    expect(field.required).toBe(true);
  });

  it('email is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.services.zendesk.auth.username')!;
    expect(field.required).toBe(true);
  });

  it('api token is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.zendesk.password')!;
    expect(field.required).toBe(true);
  });
});

describe('Zendesk field properties', () => {
  it('subdomain is stored in jsonData with variables section', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.subdomain')!;
    expect(field.target).toBe('jsonData');
    expect(field.section).toBe('variables');
    expect(field.key).toBe('subdomain');
  });

  it('email field has correct label', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.services.zendesk.auth.username')!;
    expect(field.label).toBe('Email');
  });

  it('api token field has correct label', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.zendesk.password')!;
    expect(field.label).toBe('API Token');
  });

  it('api token is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.zendesk.password')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('zendesk.password');
  });

  it('api token has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.zendesk.password')!;
    expect(field.semanticType).toBe('token');
  });
});

describe('Zendesk schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-zendesk-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Zendesk');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-zendesk-datasource');
  });
});
