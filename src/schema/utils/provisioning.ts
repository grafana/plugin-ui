// ============================================================
// Provisioning YAML generation
// ============================================================

// @ts-expect-error — js-yaml has no bundled type declarations; used only for scalar serialization
import yaml from 'js-yaml';
import type { AllowedValuesValidationRule, ConfigField, DatasourceConfigSchema } from '../schema';

// Root keys already emitted in the header (name, type) or handled separately (uid).
const HEADER_ROOT_KEYS = new Set(['name', 'type', 'uid']);
// Indentation for keys directly under a datasource entry (4 spaces)
// and for keys nested under jsonData/secureJsonData (6 spaces).
const INDENT_FIELD = '    ';
const INDENT_NESTED = '      ';

type FieldBuckets = {
  rootFields: ConfigField[];
  jsonDataFields: ConfigField[];
  secureJsonDataFields: ConfigField[];
};

const ROOT_CONFIG_FIELDS = [
  'name',
  'type',
  'id',
  'uid',
  'access',
  'url',
  'basicAuth',
  'basicAuthUser',
  'user',
  'isDefault',
  'database',
  'withCredentials',
] as const;

type YamlRenderOptions = { jsonDataKeys?: string[]; secureKeys?: string[] };

/** Serialize a scalar value as a safe YAML string using js-yaml. */
function yamlString(value: unknown): string {
  if (value === null || value === undefined) {
    return '""';
  }
  const s = String(value);
  if (s === '') {
    return '""';
  }
  return yaml.dump(s, { lineWidth: -1 }).trimEnd();
}

/** True if a secret should be emitted as a multiline (block) placeholder. */
function isMultilineSecret(field: ConfigField): boolean {
  return field.target === 'secureJsonData' && (field.ui?.multiline === true || field.ui?.component === 'textarea');
}

/** True if the field should be excluded from provisioning YAML output. */
function isExcludedFromProvisioning(field: ConfigField): boolean {
  if (field.kind === 'virtual') {
    return true;
  }
  if (field.isItemField) {
    return true;
  }
  // Fields tagged "managed-by:*" are auto-set by the wizard UI via effects.
  // Root fields like basicAuth still need to appear in provisioning YAML
  // because they are real storage fields. Only exclude managed jsonData fields.
  if (field.tags?.some((t) => t.startsWith('managed-by:')) && field.target !== 'root') {
    return true;
  }
  // Skip indexedPair storage — these are handled separately (e.g. httpHeaders)
  if (field.storage?.type === 'indexedPair') {
    return true;
  }
  return false;
}

/** Format a secureJsonData placeholder value. */
function secretPlaceholder(field: ConfigField): string {
  // Block scalar content must be indented deeper than its key (which sits at INDENT_NESTED).
  if (isMultilineSecret(field)) {
    return `|\n${INDENT_NESTED}  xxxxxx`;
  }
  return 'xxxxxx';
}

/** Default YAML value for a field in template mode. */
function templateValue(field: ConfigField): unknown {
  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }
  // Use first option value as a sensible default
  if (field.ui?.options && field.ui.options.length > 0) {
    return field.ui.options[0].value;
  }
  switch (field.valueType) {
    case 'string':
      return '';
    case 'number':
      return 0;
    case 'boolean':
      return false;
    case 'array':
      return [];
    case 'object':
    case 'map':
      return {};
    default:
      return '';
  }
}

/**
 * Format a YAML comment for a field in template mode.
 * Includes label, description, allowed values, and default.
 */
function fieldComment(field: ConfigField, indent: string): string {
  const parts: string[] = [];
  const label = field.label ?? field.key;
  let line = label;
  if (field.required) {
    line += ' (REQUIRED)';
  }
  if (field.description) {
    line += ` — ${field.description}`;
  }
  parts.push(`${indent}# ${line}`);

  const options = field.ui?.options;
  if (options && options.length > 0) {
    const vals = options.map((o) => String(o.value)).join(', ');
    parts.push(`${indent}# Allowed values: ${vals}`);
  }

  const allowedValuesRule = field.validations?.find(
    (v): v is AllowedValuesValidationRule => v.type === 'allowedValues'
  );
  if (allowedValuesRule && !options) {
    const vals = allowedValuesRule.values.map((v) => String(v)).join(', ');
    parts.push(`${indent}# Allowed values: ${vals}`);
  }

  if (field.dependsOn) {
    parts.push(`${indent}# Only when: ${field.dependsOn}`);
  }

  return parts.join('\n');
}

/**
 * Infer secureJsonData keys from jsonData keys.
 * For example, httpHeaderName1 → httpHeaderValue1 (Grafana's indexedPair convention).
 */
function inferSecureJsonDataKeys(jsonData: Record<string, unknown> | undefined): string[] {
  if (!jsonData) {
    return [];
  }
  const keys: string[] = [];
  for (const key of Object.keys(jsonData)) {
    const match = key.match(/^httpHeaderName(\d+)$/);
    if (match) {
      keys.push(`httpHeaderValue${match[1]}`);
    }
  }
  return keys;
}

/** Retrieve a nested value for a jsonData/secureJsonData field from a flat or nested values object. */
function getNestedValue(values: Record<string, unknown>, target: string, field: ConfigField): unknown {
  const nested = values[target];
  if (nested && typeof nested === 'object') {
    return (nested as Record<string, unknown>)[field.key];
  }
  return undefined;
}

/** Sort schema fields into storage buckets, preserving schema field order. */
function bucketFields(schema: DatasourceConfigSchema): FieldBuckets {
  const rootFields: ConfigField[] = [];
  const jsonDataFields: ConfigField[] = [];
  const secureJsonDataFields: ConfigField[] = [];

  for (const field of schema.fields) {
    if (isExcludedFromProvisioning(field)) {
      continue;
    }
    switch (field.target) {
      case 'root':
        rootFields.push(field);
        break;
      case 'jsonData':
        jsonDataFields.push(field);
        break;
      case 'secureJsonData':
        secureJsonDataFields.push(field);
        break;
    }
  }

  return { rootFields, jsonDataFields, secureJsonDataFields };
}

/** Push the shared provisioning header (apiVersion, datasources, name, type). */
function emitHeader(lines: string[], pluginType: string, name: unknown): void {
  lines.push('apiVersion: 1');
  lines.push('');
  lines.push('datasources:');
  lines.push(`  - name: ${yamlString(name)}`);
  lines.push(`${INDENT_FIELD}type: ${pluginType}`);
}

/** Push `key: value` as YAML lines indented under `indent`. Handles scalars, objects, and arrays. */
function pushEntry(lines: string[], indent: string, key: string, val: unknown): void {
  const dumped = yaml.dump({ [key]: val }, { indent: 2, lineWidth: -1, noRefs: true }).trimEnd();
  for (const line of dumped.split('\n')) {
    lines.push(`${indent}${line}`);
  }
}

const configToYaml = (ds: Record<string, unknown>, options: YamlRenderOptions = {}): string => {
  const { jsonDataKeys, secureKeys } = {
    jsonDataKeys: Object.keys((ds.jsonData ?? {}) as Record<string, unknown>).sort(),
    secureKeys: [
      ...new Set([
        ...Object.keys((ds.secureJsonData ?? {}) as Record<string, unknown>),
        ...Object.keys((ds.secureJsonFields ?? {}) as Record<string, boolean>),
      ]),
    ].sort(),
    ...options,
  };
  const root: Record<string, unknown> = {};

  for (const key of ROOT_CONFIG_FIELDS) {
    root[key] = ds[key] ?? '';
  }

  const jsonData = (ds.jsonData ?? {}) as Record<string, unknown>;
  if (jsonDataKeys.length > 0) {
    const jsonDataYaml: Record<string, unknown> = {};
    for (const key of jsonDataKeys) {
      jsonDataYaml[key] = jsonData[key] ?? '';
    }
    root.jsonData = jsonDataYaml;
  }

  if (secureKeys.length > 0) {
    const secureJsonData: Record<string, string> = {};
    for (const key of secureKeys) {
      secureJsonData[key] = '********';
    }
    root.secureJsonData = secureJsonData;
  }

  return yaml.dump(root, { lineWidth: -1, sortKeys: false, noRefs: true }).trimEnd();
};

/**
 * Generate a Grafana provisioning YAML from a dsconfig schema and an existing datasource's
 * values (typically a Grafana API response). Emits only values that are set, omitting schema
 * defaults to keep the output minimal. Comments are off by default.
 */
function exportProvisioningYaml(
  schema: DatasourceConfigSchema,
  values: Record<string, unknown>,
  options?: ProvisioningYamlOptions
): string {
  const showComments = options?.comments ?? false;
  const { rootFields, jsonDataFields, secureJsonDataFields } = bucketFields(schema);

  const lines: string[] = [];
  emitHeader(lines, schema.pluginType, options?.name ?? values.name ?? `my-${schema.pluginType}`);

  // Emit uid so the provisioning YAML can be used for idempotent upserts.
  if (values.uid) {
    lines.push(`${INDENT_FIELD}uid: ${yamlString(values.uid)}`);
  }

  // Root fields (url, basicAuth, basicAuthUser, database, etc.)
  for (const field of rootFields) {
    if (HEADER_ROOT_KEYS.has(field.key)) {
      continue;
    }
    const val = values[field.key];
    // Skip empty values and false booleans to keep the export clean.
    if (val === undefined || val === null || val === false) {
      continue;
    }
    if (showComments) {
      lines.push(fieldComment(field, INDENT_FIELD));
    }
    pushEntry(lines, INDENT_FIELD, field.key, val);
  }

  // jsonData — schema-declared values plus any extra keys present on the datasource.
  const jsonDataValues = values.jsonData as Record<string, unknown> | undefined;
  const hasExtraValues = !!jsonDataValues && Object.keys(jsonDataValues).length > 0;
  if (jsonDataFields.length > 0 || hasExtraValues) {
    lines.push(`${INDENT_FIELD}jsonData:`);
    // Keys owned by the schema are rendered (or intentionally skipped) below; the extra-keys
    // pass must never re-emit them, otherwise default-valued fields would leak back in.
    const schemaKeys = new Set(jsonDataFields.map((f) => f.key));

    for (const field of jsonDataFields) {
      const val = getNestedValue(values, 'jsonData', field);
      if (val === undefined || val === null) {
        continue;
      }
      // Skip default-value fields to keep the export minimal.
      if (field.defaultValue !== undefined && val === field.defaultValue) {
        continue;
      }
      if (showComments) {
        lines.push(fieldComment(field, INDENT_NESTED));
      }
      pushEntry(lines, INDENT_NESTED, field.key, val);
    }

    // Extra keys not declared in the schema (e.g. httpHeaderName1, plugin-specific keys).
    if (jsonDataValues) {
      for (const [key, val] of Object.entries(jsonDataValues)) {
        if (schemaKeys.has(key) || val === undefined || val === null) {
          continue;
        }
        pushEntry(lines, INDENT_NESTED, key, val);
      }
    }
  }

  // secureJsonData — the API reports configured secrets via `secureJsonFields: { key: true }`.
  // Emit only those, plus inferred indexedPair values (e.g. httpHeaderValue1 for httpHeaderName1).
  const secureJsonFields = (values.secureJsonFields ?? {}) as Record<string, boolean>;
  const activeSecureFields = secureJsonDataFields.filter((f) => secureJsonFields[f.key] === true);
  const inferredSecureKeys = inferSecureJsonDataKeys(jsonDataValues);

  if (activeSecureFields.length > 0 || inferredSecureKeys.length > 0) {
    lines.push(`${INDENT_FIELD}secureJsonData:`);
    const emitted = new Set<string>();
    for (const field of activeSecureFields) {
      emitted.add(field.key);
      if (showComments) {
        lines.push(fieldComment(field, INDENT_NESTED));
      }
      lines.push(`${INDENT_NESTED}${field.key}: ${secretPlaceholder(field)}`);
    }
    for (const key of inferredSecureKeys) {
      if (emitted.has(key)) {
        continue;
      }
      lines.push(`${INDENT_NESTED}${key}: xxxxxx`);
    }
  }

  return lines.join('\n');
}

type ProvisioningYamlOptions = {
  /** Include comments with field descriptions. Default: true for template, false for export. */
  comments?: boolean;
  /** Override the emitted datasource name. */
  name?: string;
};

/**
 * Generate a Grafana provisioning YAML template from a dsconfig schema.
 * Emits every schema field with sensible defaults and (by default) explanatory comments.
 */
export function generateProvisioningTemplate(
  schema: DatasourceConfigSchema,
  options?: ProvisioningYamlOptions
): string {
  const showComments = options?.comments ?? true;
  const { rootFields, jsonDataFields, secureJsonDataFields } = bucketFields(schema);

  const lines: string[] = [];
  emitHeader(lines, schema.pluginType, options?.name ?? `my-${schema.pluginType}`);

  // Root fields (url, basicAuth, basicAuthUser, database, etc.)
  for (const field of rootFields) {
    if (HEADER_ROOT_KEYS.has(field.key)) {
      continue;
    }
    const val = templateValue(field);
    if (val === undefined || val === null) {
      continue;
    }
    if (showComments) {
      lines.push(fieldComment(field, INDENT_FIELD));
    }
    pushEntry(lines, INDENT_FIELD, field.key, val);
  }

  // jsonData — every schema-declared field with its default value.
  if (jsonDataFields.length > 0) {
    lines.push(`${INDENT_FIELD}jsonData:`);
    for (const field of jsonDataFields) {
      const val = templateValue(field);
      if (val === undefined || val === null) {
        continue;
      }
      if (showComments) {
        lines.push(fieldComment(field, INDENT_NESTED));
      }
      pushEntry(lines, INDENT_NESTED, field.key, val);
    }
  }

  // secureJsonData — every schema-declared secret with a placeholder value.
  if (secureJsonDataFields.length > 0) {
    lines.push(`${INDENT_FIELD}secureJsonData:`);
    for (const field of secureJsonDataFields) {
      if (showComments) {
        lines.push(fieldComment(field, INDENT_NESTED));
      }
      lines.push(`${INDENT_NESTED}${field.key}: ${secretPlaceholder(field)}`);
    }
  }

  return lines.join('\n');
}

/**
 * Generate provisioning YAML from an existing Grafana datasource API response.
 * If a dsconfig schema is available, uses it for field ordering and comments.
 * If not, generates basic YAML from the raw API response.
 */
export function datasourceToProvisioningYaml(
  ds: Record<string, unknown>,
  schema: DatasourceConfigSchema | null
): string {
  if (schema) {
    return exportProvisioningYaml(schema, ds);
  }

  // No schema — generate basic YAML from the raw API response
  const lines: string[] = [];
  lines.push('apiVersion: 1');
  lines.push('');
  lines.push('datasources:');
  lines.push(`  - name: ${yamlString(ds.name)}`);
  if (ds.uid) {
    lines.push(`    uid: ${yamlString(ds.uid)}`);
  }
  lines.push(`    type: ${yamlString(ds.type)}`);
  if (ds.url) {
    lines.push(`    url: ${yamlString(ds.url)}`);
  }
  if (ds.database) {
    lines.push(`    database: ${yamlString(ds.database)}`);
  }
  if (ds.isDefault) {
    lines.push('    isDefault: true');
  }
  if (ds.basicAuth) {
    lines.push('    basicAuth: true');
    if (ds.basicAuthUser) {
      lines.push(`    basicAuthUser: ${yamlString(ds.basicAuthUser)}`);
    }
  }

  const jsonData = ds.jsonData as Record<string, unknown> | undefined;
  if (jsonData && Object.keys(jsonData).length > 0) {
    lines.push(`${INDENT_FIELD}jsonData:`);
    for (const [key, val] of Object.entries(jsonData)) {
      pushEntry(lines, INDENT_NESTED, key, val);
    }
  }

  // secureJsonData is never returned by the API — emit placeholder comment
  lines.push('    # secureJsonData: (secrets are not exported — add manually)');
  lines.push('    #   mySecret: xxxxxx');

  return lines.join('\n');
}

export const formatYamlDiff = (existing: Record<string, unknown>, body: Record<string, unknown>): string => {
  const updated = { ...existing, ...body };

  const existingJD = (existing.jsonData ?? {}) as Record<string, unknown>;
  const updatedJD = (updated.jsonData ?? {}) as Record<string, unknown>;
  const jsonDataKeys = [...new Set([...Object.keys(existingJD), ...Object.keys(updatedJD)])].sort();

  const secureKeys = [
    ...new Set([
      ...Object.keys((existing.secureJsonData ?? {}) as Record<string, unknown>),
      ...Object.keys((existing.secureJsonFields ?? {}) as Record<string, boolean>),
      ...Object.keys((updated.secureJsonData ?? {}) as Record<string, unknown>),
      ...Object.keys((updated.secureJsonFields ?? {}) as Record<string, boolean>),
    ]),
  ].sort();

  const currentYaml = configToYaml(existing, { jsonDataKeys, secureKeys });
  const updatedYaml = configToYaml(updated, { jsonDataKeys, secureKeys });

  const oldLines = currentYaml.split('\n');
  const newLines = updatedYaml.split('\n');
  const maxLen = Math.max(oldLines.length, newLines.length);
  const diffLines: string[] = [];

  for (let i = 0; i < maxLen; i++) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === newLine) {
      diffLines.push(` ${oldLine}`);
      continue;
    }
    if (oldLine !== undefined) {
      diffLines.push(`-${oldLine}`);
    }
    if (newLine !== undefined) {
      diffLines.push(`+${newLine}`);
    }
  }

  return '```diff\n' + diffLines.join('\n') + '\n```';
};
