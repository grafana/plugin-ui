/**
 * Tests for Cloudflare schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-cloudflare-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Cloudflare schema structure', () => {
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
    expect(auth.group.fieldRefs).toContain('secureJsonData.cloudflare.token');
  });
});

describe('Cloudflare required fields', () => {
  it('token is required', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.cloudflare.token')!;
    expect(field.required).toBe(true);
  });
});

describe('Cloudflare field properties', () => {
  it('token is stored in secureJsonData', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.cloudflare.token')!;
    expect(field.target).toBe('secureJsonData');
    expect(field.key).toBe('cloudflare.token');
  });

  it('token has token semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'secureJsonData.cloudflare.token')!;
    expect(field.semanticType).toBe('token');
  });
});

describe('Cloudflare schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-cloudflare-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Cloudflare');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-cloudflare-datasource');
  });
});
