/**
 * Tests for Netlify schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-netlify-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Netlify schema structure', () => {
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
    expect(auth.group.fieldRefs).toContain('secureJsonData.Netlify.token');
  });
});

describe('Netlify required fields', () => {
  it('token is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.Netlify.token')!;
    expect(field.required).toBe(true);
  });
});

describe('Netlify field properties', () => {
  it('token is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.Netlify.token')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('Netlify.token');
  });

  it('token has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.Netlify.token')!;
    expect(field.semanticType).toBe('token');
  });
});

describe('Netlify schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-netlify-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Netlify');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-netlify-datasource');
  });
});
