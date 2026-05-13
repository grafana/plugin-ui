import { getBackendSrv } from '@grafana/runtime';
import type { ConfigField } from './schema';
import { formKey } from './config';
import type { DatasourceResponse, DatasourceConfigPayload, FormValues } from './types';

export const SECURE_FIELD_CONFIGURED = '__CONFIGURED__';

export type FetchExistingResult = {
  values: FormValues;
  readOnly: boolean;
  error?: string;
};

/** Indexed pair item as stored in form values. Each item tracks its original storage index. */
export type IndexedPairItem = {
  /** Original storage index (e.g. 1 for httpHeaderName1). 0 = new item, not yet persisted. */
  index: number;
  name: string;
  value: string;
};

/**
 * Build a RegExp that matches keys produced by a pattern like "httpHeaderName{index}"
 * and captures the numeric index.
 */
function patternToRegex(pattern: string): RegExp {
  const escaped = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp('^' + escaped.replace('\\{index\\}', '(\\d+)') + '$');
}

/**
 * Find all numeric indices present in a record for a given pattern.
 * E.g. for pattern "httpHeaderName{index}" and keys {httpHeaderName1, httpHeaderName3}
 * returns a sorted array [1, 3].
 */
function findIndicesForPattern(record: Record<string, unknown>, pattern: string): number[] {
  const re = patternToRegex(pattern);
  const indices: number[] = [];
  for (const key of Object.keys(record)) {
    const m = key.match(re);
    if (m) {
      const n = Number(m[1]);
      if (!Number.isNaN(n)) {
        indices.push(n);
      }
    }
  }
  return indices.sort((a, b) => a - b);
}

/**
 * Expand indexed pair storage (e.g. httpHeaderName1..N / httpHeaderValue1..N)
 * into an array of {index, name, value} items for the form.
 * Each item's `index` tracks its storage position so deletes don't shift others.
 * Scans all keys in the source record to find matching indices — no gap heuristics.
 */
export function expandIndexedPair(field: ConfigField, ds: DatasourceResponse): IndexedPairItem[] {
  const storage = field.storage;
  if (storage?.type !== 'indexedPair' || !storage.key || !storage.value) {
    return [];
  }
  const source = storage.key.target === 'jsonData' ? (ds.jsonData ?? {}) : (ds as Record<string, unknown>);
  const indices = findIndicesForPattern(source as Record<string, unknown>, storage.key.pattern);
  const items: IndexedPairItem[] = [];
  for (const i of indices) {
    const nameKey = storage.key.pattern.replace('{index}', String(i));
    const valueKey = storage.value.pattern.replace('{index}', String(i));
    const nameVal = (source as Record<string, unknown>)[nameKey];
    if (nameVal === undefined || nameVal === null) {
      continue;
    }
    const hasValue =
      storage.value.target === 'secureJsonData' ? !!ds.secureJsonFields?.[valueKey] : !!ds.jsonData?.[valueKey];
    items.push({
      index: i,
      name: String(nameVal),
      value: hasValue ? SECURE_FIELD_CONFIGURED : '',
    });
  }
  return items;
}

/**
 * Flatten an array of indexed pair items back into individual indexed keys
 * for jsonData and secureJsonData.
 */
export function flattenIndexedPair(
  field: ConfigField,
  items: IndexedPairItem[],
  jsonData: Record<string, unknown>,
  secureJsonData: Record<string, string>,
  secureJsonFields: Record<string, boolean>
) {
  const storage = field.storage;
  if (storage?.type !== 'indexedPair' || !storage.key || !storage.value) {
    return;
  }
  // Find all existing storage indices by scanning keys in jsonData.
  const existingIndices = new Set(
    storage.key.target === 'jsonData'
      ? findIndicesForPattern(jsonData as Record<string, unknown>, storage.key.pattern)
      : []
  );

  // Track which indices are still in use by the surviving items.
  const usedIndices = new Set<number>();
  const startIdx = storage.startIndex ?? 1;
  let nextIndex = existingIndices.size > 0 ? Math.max(...existingIndices) + 1 : startIdx;

  // Write each item at its original index. New items (index === 0) get the next available.
  for (const item of items) {
    let idx = item.index;
    if (idx === 0) {
      idx = nextIndex++;
    }
    usedIndices.add(idx);
    const nameKey = storage.key.pattern.replace('{index}', String(idx));
    const valueKey = storage.value.pattern.replace('{index}', String(idx));
    if (storage.key.target === 'jsonData') {
      jsonData[nameKey] = item.name;
    }
    if (storage.value.target === 'secureJsonData') {
      if (item.value === SECURE_FIELD_CONFIGURED) {
        secureJsonFields[valueKey] = true;
      } else if (item.value) {
        secureJsonData[valueKey] = item.value;
        secureJsonFields[valueKey] = false;
      }
    } else if (storage.value.target === 'jsonData') {
      jsonData[valueKey] = item.value;
    }
  }

  // Clear deleted indices: indices that existed before but are no longer in use.
  for (const idx of existingIndices) {
    if (usedIndices.has(idx)) {
      continue;
    }
    const nameKey = storage.key.pattern.replace('{index}', String(idx));
    const valueKey = storage.value.pattern.replace('{index}', String(idx));
    if (storage.key.target === 'jsonData') {
      delete jsonData[nameKey];
    }
    if (storage.value.target === 'secureJsonData') {
      delete secureJsonFields[valueKey];
      delete secureJsonData[valueKey];
    } else if (storage.value.target === 'jsonData') {
      delete jsonData[valueKey];
    }
  }
}

/**
 * Resolve a dotted storage path against the raw API response.
 * Handles: "jsonData.server", "root.database", "secureJsonData.password"
 */
function resolveRawPath(ref: string, ds: DatasourceResponse): unknown {
  const trimmed = ref.trim();
  if (trimmed.startsWith('jsonData.')) {
    return ds.jsonData?.[trimmed.slice(9)];
  }
  if (trimmed.startsWith('root.')) {
    return (ds as Record<string, unknown>)[trimmed.slice(5)];
  }
  return undefined;
}

export async function fetchExistingValues(dsUid: string, fields: ConfigField[]): Promise<FetchExistingResult> {
  try {
    const ds: DatasourceResponse = await getBackendSrv().get(`/api/datasources/uid/${dsUid}`, undefined, undefined, {
      showErrorAlert: false,
    });

    const values: FormValues = {};
    for (const field of fields) {
      // Expand indexedPair storage: read httpHeaderName1..N + secureJsonFields httpHeaderValue1..N
      if (field.storage?.type === 'indexedPair') {
        values[field.key] = expandIndexedPair(field, ds);
        continue;
      }
      const fk = formKey(field);
      switch (field.target) {
        case 'root':
          if (ds[field.key] !== undefined) {
            values[fk] = ds[field.key];
          }
          break;
        case 'jsonData':
          // Section-scoped fields are stored nested: jsonData.{section}.{key}
          if (field.section) {
            const sectionObj = ds.jsonData?.[field.section] as Record<string, unknown> | undefined;
            if (sectionObj?.[field.key] !== undefined) {
              values[fk] = sectionObj[field.key];
            }
          } else if (ds.jsonData?.[field.key] !== undefined) {
            values[fk] = ds.jsonData[field.key];
          }
          break;
        case 'secureJsonData':
          if (ds.secureJsonFields?.[field.key]) {
            values[fk] = SECURE_FIELD_CONFIGURED;
          }
          break;
      }

      // Fallback: if value is still missing and field has storage.read,
      // resolve the expression against the raw API response.
      if (values[fk] === undefined && field.storage?.type === 'computed' && field.storage.read) {
        const fallback = resolveRawPath(field.storage.read, ds);
        if (fallback !== undefined) {
          values[fk] = fallback;
        }
      }
    }
    return { values, readOnly: !!ds.readOnly };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to load datasource configuration';
    return { values: {}, readOnly: false, error: message };
  }
}

export function buildDatasourceConfigPayload(
  data: FormValues,
  fields: ConfigField[],
  existing: DatasourceResponse,
  isFieldVisible: (field: ConfigField) => boolean
): DatasourceConfigPayload {
  const rootFields: Record<string, unknown> = {};
  const jsonData: Record<string, unknown> = { ...(existing.jsonData ?? {}) };
  const secureJsonData: Record<string, string> = {};
  const secureJsonFields: Record<string, boolean> = { ...(existing.secureJsonFields ?? {}) };

  for (const field of fields) {
    // Flatten indexedPair storage back into individual indexed keys
    if (field.storage?.type === 'indexedPair') {
      const items = Array.isArray(data[field.key]) ? (data[field.key] as IndexedPairItem[]) : [];
      flattenIndexedPair(field, items, jsonData, secureJsonData, secureJsonFields);
      continue;
    }

    // Always include fields managed by effects (tagged "managed-by:*")
    // even when they're hidden from the UI — their values are set by effects.
    const isManagedByEffect = field.tags?.some((t) => t.startsWith('managed-by:'));
    if (!isManagedByEffect && !isFieldVisible(field)) {
      continue;
    }
    const fk = formKey(field);
    const value = data[fk];

    if (field.target === 'secureJsonData') {
      if (value === SECURE_FIELD_CONFIGURED) {
        secureJsonFields[field.key] = true;
        continue;
      }
      if (value && value !== '') {
        secureJsonData[field.key] = String(value);
        secureJsonFields[field.key] = false;
      } else {
        secureJsonFields[field.key] = false;
      }
      continue;
    }

    if (value === undefined || value === '') {
      continue;
    }
    switch (field.target) {
      case 'root':
        rootFields[field.key] = value;
        break;
      case 'jsonData':
        // Section-scoped fields write to jsonData.{section}.{key}
        if (field.section) {
          if (!jsonData[field.section] || typeof jsonData[field.section] !== 'object') {
            jsonData[field.section] = {};
          }
          (jsonData[field.section] as Record<string, unknown>)[field.key] = value;
        } else {
          jsonData[field.key] = value;
        }
        break;
    }
  }

  return { rootFields, jsonData, secureJsonData, secureJsonFields };
}

export async function submitDatasourceConfig(
  dsUid: string,
  data: FormValues,
  fields: ConfigField[],
  isFieldVisible: (field: ConfigField) => boolean
): Promise<void> {
  const existing: DatasourceResponse = await getBackendSrv().get(`/api/datasources/uid/${dsUid}`);
  const { rootFields, jsonData, secureJsonData, secureJsonFields } = buildDatasourceConfigPayload(
    data,
    fields,
    existing,
    isFieldVisible
  );

  await getBackendSrv().put(`/api/datasources/uid/${dsUid}`, {
    ...existing,
    ...rootFields,
    jsonData,
    secureJsonData,
    secureJsonFields,
  });
}
