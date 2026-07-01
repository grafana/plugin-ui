import { PACK_STATIC_URL } from './constants';
import type { BaseFieldRef, ConfigField, DatasourceConfigSchema, FieldPack, FieldPackID, FieldPatch } from '../schema';

const PACK_IDS: FieldPackID[] = [
  'plugin_sdk_settings',
  'aws_sdk_settings',
  'azure_sdk_settings',
  'google_sdk_settings',
  'sqleng_settings',
];

const packCache = new Map<FieldPackID, Promise<FieldPack>>();

export function loadPack(id: FieldPackID): Promise<FieldPack> {
  if (!PACK_IDS.includes(id)) {
    return Promise.reject(new Error(`unknown field pack: ${id}`));
  }
  const existing = packCache.get(id);
  if (existing) {
    return existing;
  }
  const promise = fetchPack(id).catch((err) => {
    // Evict failed fetches so callers can retry.
    packCache.delete(id);
    throw err;
  });
  packCache.set(id, promise);
  return promise;
}

async function fetchPack(id: FieldPackID): Promise<FieldPack> {
  const res = await fetch(PACK_STATIC_URL.replaceAll('{packID}', id));
  if (!res.ok) {
    throw new Error(`failed to fetch field pack ${id}: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as FieldPack;
}

function resolvePackRef(ref: BaseFieldRef, pack: FieldPack): ConfigField[] {
  const cloned = deepClone(pack.fields);
  const byId = new Map(cloned.map((f) => [f.id, f] as const));

  if (ref.exclude) {
    for (const id of ref.exclude) {
      if (!byId.has(id)) {
        throw new Error(`baseFields[${ref.from}]: exclude references unknown field id: ${id}`);
      }
      byId.delete(id);
    }
  }

  const dropped = new Set<string>();
  if (ref.patch) {
    for (const [id, patch] of Object.entries(ref.patch)) {
      const field = byId.get(id);
      if (!field) {
        throw new Error(`baseFields[${ref.from}]: patch references unknown field id: ${id}`);
      }
      if (patch.hidden) {
        dropped.add(id);
        continue;
      }
      applyPatch(field, patch);
    }
  }

  // Preserve pack declaration order.
  return cloned.filter((f) => byId.has(f.id) && !dropped.has(f.id));
}

function applyPatch(field: ConfigField, patch: FieldPatch): void {
  if (patch.label !== undefined) {
    field.label = patch.label;
  }
  if (patch.description !== undefined) {
    field.description = patch.description;
  }
  if (patch.placeholder !== undefined) {
    field.ui = { ...(field.ui ?? { component: 'input' }), placeholder: patch.placeholder };
  }
  if (patch.defaultValue !== undefined) {
    field.defaultValue = patch.defaultValue;
  }
  if (patch.required !== undefined) {
    field.required = patch.required;
  }
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}

export async function resolveBaseFields(schema: DatasourceConfigSchema): Promise<DatasourceConfigSchema> {
  const refs = schema.baseFields;
  if (!refs || refs.length === 0) {
    return schema;
  }
  const packs = await Promise.all(refs.map((ref) => loadPack(ref.from)));
  const packFields: ConfigField[] = [];
  const packFieldIds = new Set<string>();

  refs.forEach((ref, i) => {
    const resolved = resolvePackRef(ref, packs[i]);
    for (const f of resolved) {
      if (packFieldIds.has(f.id)) {
        continue;
      }
      packFieldIds.add(f.id);
      packFields.push(f);
    }
  });
  const pluginIds = new Set((schema.fields ?? []).map((f) => f.id));
  const survivingPackFields = packFields.filter((f) => !pluginIds.has(f.id));
  const { baseFields: _omit, ...rest } = schema;
  return {
    ...rest,
    fields: [...survivingPackFields, ...(schema.fields ?? [])],
  };
}
