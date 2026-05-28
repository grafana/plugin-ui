/**
 * Tests for Solarwinds schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-solarwinds-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Solarwinds schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(3);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth']);
  });

  it('connection group has url', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('jsonData.variables.url');
  });

  it('auth group has username and password', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('jsonData.services.solarwinds.auth.username');
    expect(auth.group.fieldRefs).toContain('secureJsonData.solarwinds.password');
  });
});

describe('Solarwinds required fields', () => {
  it('url is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.url')!;
    expect(field.required).toBe(true);
  });

  it('username is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.services.solarwinds.auth.username')!;
    expect(field.required).toBe(true);
  });

  it('password is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.solarwinds.password')!;
    expect(field.required).toBe(true);
  });
});

describe('Solarwinds field properties', () => {
  it('url is stored in jsonData with variables section', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.url')!;
    expect(field.target).toBe('jsonData');
    expect(field.section).toBe('variables');
    expect(field.semanticType).toBe('url');
  });

  it('username is stored in jsonData', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.services.solarwinds.auth.username')!;
    expect(field.target).toBe('jsonData');
  });

  it('password is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.solarwinds.password')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('solarwinds.password');
  });

  it('password has password semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.solarwinds.password')!;
    expect(field.semanticType).toBe('password');
  });
});

describe('Solarwinds schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-solarwinds-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Solarwinds');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-solarwinds-datasource');
  });
});
