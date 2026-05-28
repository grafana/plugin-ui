/**
 * Tests for Catchpoint schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-catchpoint-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Catchpoint schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(1);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['auth']);
  });

  it('auth group has bearer token', () => {
    const groups = resolveGroups(schema);
    const auth = groups.find((g) => g.group.id === 'auth')!;
    expect(auth.group.fieldRefs).toContain('secureJsonData.catchpoint.token');
  });
});

describe('Catchpoint required fields', () => {
  it('token is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.catchpoint.token')!;
    expect(field.required).toBe(true);
  });
});

describe('Catchpoint field properties', () => {
  it('token is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.catchpoint.token')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('catchpoint.token');
  });

  it('token has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.catchpoint.token')!;
    expect(field.semanticType).toBe('token');
  });
});

describe('Catchpoint schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-catchpoint-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Catchpoint');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-catchpoint-datasource');
  });
});
