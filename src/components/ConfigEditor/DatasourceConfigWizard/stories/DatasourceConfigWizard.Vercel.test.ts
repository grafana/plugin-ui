/**
 * Tests for Vercel schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-vercel-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Vercel schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(2);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection', 'auth']);
  });

  it('connection group has team_id', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('jsonData.variables.team_id');
  });

  it('auth group has bearer token', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('secureJsonData.vercel.token');
  });
});

describe('Vercel required fields', () => {
  it('team_id is optional', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.team_id')!;
    expect(field.required).toBeUndefined();
  });

  it('token is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.vercel.token')!;
    expect(field.required).toBe(true);
  });
});

describe('Vercel field properties', () => {
  it('team_id is stored in jsonData with variables section', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.team_id')!;
    expect(field.target).toBe('jsonData');
    expect(field.section).toBe('variables');
    expect(field.key).toBe('team_id');
  });

  it('token is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.vercel.token')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('vercel.token');
    expect(field.semanticType).toBe('token');
  });

  it('team_id has placeholder', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.team_id')!;
    expect(field.ui?.placeholder).toBe('eg: team_1a2b3c4d5e6f7g8h9i0j1k2l');
  });
});

describe('Vercel schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-vercel-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Vercel');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-vercel-datasource');
  });
});
