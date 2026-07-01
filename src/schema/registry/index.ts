import { getBackendSrv } from '@grafana/runtime';

import type { DatasourceConfigSchema } from '../schema';

import { getStaticConfigSchema } from './staticRegistry';

export { getStaticConfigSchema, staticSchemaRegistry } from './staticRegistry';

const SCHEMA_PATH = '/public/plugins/{pluginType}/schema/dsconfig.json';

export function getConfigSchemaUrl(pluginType: string): string {
  return SCHEMA_PATH.replaceAll('{pluginType}', pluginType);
}

const schemaCache = new Map<string, DatasourceConfigSchema | null>();

export async function getConfigSchema(pluginType: string): Promise<DatasourceConfigSchema | null> {
  const cached = schemaCache.get(pluginType);
  if (cached !== undefined) {
    return cached;
  }

  const url = getConfigSchemaUrl(pluginType);

  let schema: DatasourceConfigSchema | null;
  try {
    schema = await getBackendSrv().get<DatasourceConfigSchema>(url);
  } catch {
    // No schema served by the local plugin (e.g. 404); fall back to the
    // bundled static schema.
    schema = getStaticConfigSchema(pluginType);
  }

  schemaCache.set(pluginType, schema);
  return schema;
}
