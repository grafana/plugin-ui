// import { getBackendSrv } from '@grafana/runtime';
import { resolveBaseFields } from './packs';
// import { DSCONFIG_STATIC_URL } from './constants';
import type { DatasourceConfigSchema } from '../schema';

const schemaCache = new Map<string, DatasourceConfigSchema | null>();

export async function getConfigSchema(pluginType: string): Promise<DatasourceConfigSchema | null> {
  const cached = schemaCache.get(pluginType);
  if (cached !== undefined) {
    return cached;
  }

  let schema: DatasourceConfigSchema | null;
  try {
    // TODO: When going prod, use the schema from the plugin instead of static schema
    const SCHEMA_BASE_URL = 'https://raw.githubusercontent.com/grafana/dsconfig/schema-discovery/registry';
    let res = await fetch(`${SCHEMA_BASE_URL}/${pluginType}/dsconfig.json`);
    schema = (await res.json()) as DatasourceConfigSchema;
    // schema = await getBackendSrv().get<DatasourceConfigSchema>(
    //   DSCONFIG_STATIC_URL.replaceAll('{pluginType}', pluginType)
    // );
  } catch {
    console.warn(`no schema available for ${pluginType}`);
    schema = {} as DatasourceConfigSchema;
  }
  if (schema) {
    try {
      schema = await resolveBaseFields(schema);
    } catch (err) {
      console.error(`failed to resolve baseFields for ${pluginType}:`, err);
      // Cache the raw schema so unrelated fields still render.
    }
  }

  schemaCache.set(pluginType, schema);
  return schema;
}
