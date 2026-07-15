import { getBackendSrv } from '@grafana/runtime';
import type { DatasourceConfigSchema } from '../schema';

const SCHEMA_BASE_URL_FROM_PLUGIN = '/public/plugins/{pluginType}/schema/dsconfig.json';
const SCHEMA_BASE_URL_FROM_STATIC =
  'https://raw.githubusercontent.com/grafana/dsconfig/schema-discovery/registry/{pluginType}/dsconfig.json';

const schemaCache = new Map<string, DatasourceConfigSchema | null>();

export async function getConfigSchema(pluginType: string): Promise<DatasourceConfigSchema | null> {
  const cached = schemaCache.get(pluginType);
  if (cached !== undefined) {
    return cached;
  }
  let schema: DatasourceConfigSchema | null;
  try {
    schema = await getBackendSrv().get<DatasourceConfigSchema>(
      SCHEMA_BASE_URL_FROM_PLUGIN.replaceAll('{pluginType}', pluginType)
    );
    schemaCache.set(pluginType, schema);
  } catch {
    try {
      let res = await fetch(SCHEMA_BASE_URL_FROM_STATIC.replaceAll('{pluginType}', pluginType));
      schema = (await res.json()) as DatasourceConfigSchema;
      schemaCache.set(pluginType, schema);
    } catch {
      console.warn(`no schema available for ${pluginType}`);
      schema = {} as DatasourceConfigSchema;
    }
  }
  return schema;
}
