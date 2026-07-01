import { getBackendSrv } from '@grafana/runtime';

import type { DatasourceConfigSchema } from '../schema';

const schemaCache = new Map<string, DatasourceConfigSchema | null>();

export async function getConfigSchema(pluginType: string): Promise<DatasourceConfigSchema | null> {
  const cached = schemaCache.get(pluginType);
  if (cached !== undefined) {
    return cached;
  }

  let schema: DatasourceConfigSchema | null;
  try {
    schema = await getBackendSrv().get<DatasourceConfigSchema>(
      '/public/plugins/{pluginType}/schema/dsconfig.json'.replaceAll('{pluginType}', pluginType)
    );
  } catch {
    console.warn(`no schema available for ${pluginType}`);
    schema = {} as DatasourceConfigSchema;
  }
  schemaCache.set(pluginType, schema);
  return schema;
}
