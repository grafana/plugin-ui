import { useMemo } from 'react';
import { getConfigSchema } from '../registry';
import type { DatasourceConfigSchema } from '../schema';

type UseDatasourceSchemaResult = { schema: DatasourceConfigSchema | null; loading: boolean; error: string | null };

export function useDatasourceSchema(pluginType: string): UseDatasourceSchemaResult {
  const schema = useMemo(() => fetchConfigSchema(pluginType), [pluginType]);
  return { schema, loading: false, error: null };
}

export function fetchConfigSchema(pluginType: string): DatasourceConfigSchema | null {
  if (!pluginType) {
    return null;
  }
  return getConfigSchema(pluginType);
}
