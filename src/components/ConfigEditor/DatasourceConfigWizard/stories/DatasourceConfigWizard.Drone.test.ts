/**
 * Tests for Drone schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-drone-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Drone schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(2);
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

  it('auth group has bearer token', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('secureJsonData.drone.token');
  });
});

describe('Drone required fields', () => {
  it('url is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.url')!;
    expect(field.required).toBe(true);
  });

  it('token is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.drone.token')!;
    expect(field.required).toBe(true);
  });
});

describe('Drone field properties', () => {
  it('url is stored in jsonData with variables section', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.url')!;
    expect(field.target).toBe('jsonData');
    expect(field.section).toBe('variables');
    expect(field.semanticType).toBe('url');
  });

  it('token is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.drone.token')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('drone.token');
    expect(field.semanticType).toBe('token');
  });
});

describe('Drone schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-drone-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Drone');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-drone-datasource');
  });
});
