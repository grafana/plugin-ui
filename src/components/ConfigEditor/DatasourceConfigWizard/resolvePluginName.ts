import { getDataSourceSrv } from '@grafana/runtime';

let pluginNameCache: Map<string, string> | null = null;

function buildPluginNameCache(): Map<string, string> {
  if (pluginNameCache) {
    return pluginNameCache;
  }
  const map = new Map<string, string>();
  try {
    const list = getDataSourceSrv().getList();
    for (const ds of list) {
      if (ds.meta?.name && ds.type && !map.has(ds.type)) {
        map.set(ds.type, ds.meta.name);
      }
    }
  } catch (ex) {
    console.error(ex);
  }
  pluginNameCache = map;
  return map;
}

export function resolvePluginName(pluginType: string): string {
  const cache = buildPluginNameCache();
  return cache.get(pluginType) ?? pluginType;
}
