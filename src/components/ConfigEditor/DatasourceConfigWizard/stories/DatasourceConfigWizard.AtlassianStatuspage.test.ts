/**
 * Tests for Atlassian Statuspage schema.
 */
import type { DatasourceConfigSchema } from '../../../../schema/schema';
import { resolveGroups } from '../config';
import schemaJson from '../../../../schema/registry/grafana-atlassianstatuspage-datasource.schema.json';

const schema = schemaJson as unknown as DatasourceConfigSchema;

describe('Atlassian Statuspage schema structure', () => {
  it('has expected number of fields', () => {
    expect(schema.fields.length).toBe(1);
  });

  it('has expected groups', () => {
    const groups = resolveGroups(schema);
    const ids = groups.map((g) => g.group.id);
    expect(ids).toEqual(['connection']);
  });

  it('connection group has url', () => {
    const groups = resolveGroups(schema);
    const conn = groups.find((g) => g.group.id === 'connection')!;
    expect(conn.group.fieldRefs).toContain('jsonData.variables.url');
  });
});

describe('Atlassian Statuspage required fields', () => {
  it('url is required', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.url')!;
    expect(field.required).toBe(true);
  });
});

describe('Atlassian Statuspage field properties', () => {
  it('url is stored in jsonData with variables section', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.url')!;
    expect(field.target).toBe('jsonData');
    expect(field.section).toBe('variables');
    expect(field.key).toBe('url');
  });

  it('url has url semantic type', () => {
    const field = schema.fields.find((f) => f.id === 'jsonData.variables.url')!;
    expect(field.semanticType).toBe('url');
  });

  it('has no authentication fields', () => {
    const secureFields = schema.fields.filter((f) => f.target === 'secureJsonData');
    expect(secureFields).toHaveLength(0);
  });
});

describe('Atlassian Statuspage has no conditional fields', () => {
  it('no fields have dependsOn', () => {
    const fieldsWithDependsOn = schema.fields.filter((f) => f.dependsOn);
    expect(fieldsWithDependsOn).toHaveLength(0);
  });
});

describe('Atlassian Statuspage schema metadata', () => {
  it('has correct plugin type', () => {
    expect(schema.pluginType).toBe('grafana-atlassianstatuspage-datasource');
  });

  it('has correct plugin name', () => {
    expect(schema.pluginName).toBe('Atlassian Statuspage');
  });

  it('has doc URL', () => {
    expect(schema.docURL).toBe('https://grafana.com/docs/plugins/grafana-atlassianstatuspage-datasource');
  });
});
