import { useEffect, useState } from 'react';
import { getConfigSchema } from '../registry';
import type { DatasourceConfigSchema } from '../schema';

type UseDatasourceSchemaResult = { schema: DatasourceConfigSchema | null; loading: boolean; error: string | null };

export function useDatasourceSchema(pluginType: string): UseDatasourceSchemaResult {
  const [schema, setSchema] = useState<DatasourceConfigSchema | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchConfigSchema(pluginType)
      .then((result) => {
        if (!cancelled) {
          setSchema(result);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [pluginType]);

  return { schema, loading, error };
}

export function fetchConfigSchema(pluginType: string): Promise<DatasourceConfigSchema | null> {
  if (!pluginType) {
    return Promise.resolve(null);
  }
  return getConfigSchema(pluginType);
}
