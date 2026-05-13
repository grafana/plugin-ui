// @ts-expect-error — js-yaml has no bundled type declarations; used only for scalar serialization
import yaml from 'js-yaml';
import {
  resolveGroups,
  type AllowedValuesValidation,
  type ConfigField,
  type ConfigGroup,
  type DatasourceConfigSchema,
} from './config';

// ============================================================
// Provisioning YAML generation
// ============================================================

/** Indent each line by `depth * 2` spaces. */
function yamlIndent(depth: number): string {
  return '  '.repeat(depth);
}

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

/** Format a value as YAML inline. */
function yamlValue(value: unknown, depth: number): string {
  if (value === null || value === undefined) {
    return '""';
  }
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return yamlString(value);
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    const lines = value.map((item) => {
      if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
        const entries = Object.entries(item as Record<string, unknown>);
        if (entries.length === 0) {
          return `${yamlIndent(depth)}- {}`;
        }
        const [firstKey, firstVal] = entries[0];
        const firstLine = `${yamlIndent(depth)}- ${yamlString(firstKey)}: ${yamlValue(firstVal, depth + 2)}`;
        const rest = entries
          .slice(1)
          .map(([k, v]) => `${yamlIndent(depth + 1)}${yamlString(k)}: ${yamlValue(v, depth + 2)}`);
        return [firstLine, ...rest].join('\n');
      }
      return `${yamlIndent(depth)}- ${yamlValue(item, depth + 1)}`;
    });
    return '\n' + lines.join('\n');
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) {
      return '{}';
    }
    const lines = entries.map(([k, v]) => `${yamlIndent(depth)}${yamlString(k)}: ${yamlValue(v, depth + 1)}`);
    return '\n' + lines.join('\n');
  }
  return yamlString(value);
}

/** True if the field is a certificate or key (multiline secret). */
function isCertField(field: ConfigField): boolean {
  const k = field.key.toLowerCase();
  return (
    field.target === 'secureJsonData' && (k.includes('cert') || k.includes('key') || field.ui?.component === 'textarea')
  );
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
  if (isCertField(field)) {
    return '|\n      xxxxxx';
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

  const allowedValuesRule = field.validations?.find((v): v is AllowedValuesValidation => v.type === 'allowedValues');
  if (allowedValuesRule && !options) {
    const vals = allowedValuesRule.values.map((v) => String(v)).join(', ');
    parts.push(`${indent}# Allowed values: ${vals}`);
  }

  if (field.dependsOn) {
    parts.push(`${indent}# Only when: ${field.dependsOn}`);
  }

  return parts.join('\n');
}

export type ProvisioningYamlOptions = {
  /** Include comments with field descriptions. Default: true for template, false for export. */
  comments?: boolean;
  /** Name override (used in template mode). */
  name?: string;
};

/**
 * Generate a Grafana provisioning YAML from a dsconfig schema.
 * In template mode (no values), emits all fields with defaults and comments.
 * When values are provided, emits actual values — used for existing datasource export.
 */
export function toProvisioningYaml(
  schema: DatasourceConfigSchema,
  values?: Record<string, unknown>,
  options?: ProvisioningYamlOptions
): string {
  const isTemplate = !values;
  const showComments = options?.comments ?? isTemplate;
  const indent2 = '    ';
  const indent3 = '      ';

  // Use schema groups to order fields logically (connection → auth → network → etc.)
  const groups = resolveGroups(schema);
  const rootFields: ConfigField[] = [];
  const jsonDataFieldsByGroup: Array<{ group: ConfigGroup; fields: ConfigField[] }> = [];
  const secureJsonDataFieldsByGroup: Array<{ group: ConfigGroup; fields: ConfigField[] }> = [];
  const virtualFieldsWithOptions: ConfigField[] = [];

  for (const { group, fields } of groups) {
    const jd: ConfigField[] = [];
    const sd: ConfigField[] = [];
    for (const field of fields) {
      // Collect virtual fields with UI options (e.g. auth.method) for comment-only output
      if (field.kind === 'virtual' && field.ui?.options && field.ui.options.length > 0) {
        virtualFieldsWithOptions.push(field);
        continue;
      }
      if (isExcludedFromProvisioning(field)) {
        continue;
      }
      switch (field.target) {
        case 'root':
          rootFields.push(field);
          break;
        case 'jsonData':
          jd.push(field);
          break;
        case 'secureJsonData':
          sd.push(field);
          break;
      }
    }
    if (jd.length > 0) {
      jsonDataFieldsByGroup.push({ group, fields: jd });
    }
    if (sd.length > 0) {
      secureJsonDataFieldsByGroup.push({ group, fields: sd });
    }
  }

  const allSecureJsonDataFields = secureJsonDataFieldsByGroup.flatMap((g) => g.fields);

  // Pick up root fields not referenced in any group (e.g. root.basicAuth is managed
  // by auth.method effects and not listed in the auth group's fieldRefs).
  const groupedFieldIds = new Set(groups.flatMap(({ group }) => group.fieldRefs));
  for (const field of schema.fields) {
    if (field.target === 'root' && !groupedFieldIds.has(field.id) && !isExcludedFromProvisioning(field)) {
      rootFields.push(field);
    }
  }

  const lines: string[] = [];
  lines.push('apiVersion: 1');
  lines.push('');
  lines.push('datasources:');
  lines.push(`${indent2.slice(2)}- name: ${yamlString(options?.name ?? values?.name ?? `my-${schema.pluginType}`)}`);
  lines.push(`${indent2}type: ${schema.pluginType}`);

  // In export mode, emit uid so the provisioning YAML can be used for idempotent upserts.
  if (!isTemplate && values?.uid) {
    lines.push(`${indent2}uid: ${yamlString(values.uid)}`);
  }

  // Root fields (url, basicAuth, basicAuthUser, database, etc.)
  const ALREADY_EMITTED_ROOT = new Set(['name', 'type', 'uid']);
  for (const field of rootFields) {
    if (ALREADY_EMITTED_ROOT.has(field.key)) {
      continue;
    }
    const val = values ? values[field.key] : templateValue(field);
    if (val === undefined || val === null) {
      continue;
    }
    // Skip false booleans in export mode to keep YAML clean
    if (!isTemplate && val === false) {
      continue;
    }
    if (showComments) {
      lines.push(fieldComment(field, indent2));
    }
    lines.push(`${indent2}${field.key}: ${yamlValue(val, 3)}`);
  }

  // Emit virtual fields with UI options as comments (e.g. auth.method selector)
  // These explain configuration choices even though they aren't stored directly.
  if (showComments) {
    for (const vf of virtualFieldsWithOptions) {
      const label = vf.label ?? vf.key;
      const opts = vf.ui!.options!.map((o) => `${String(o.value)} (${o.label})`).join(', ');
      lines.push(`${indent2}# ${label}: ${opts}`);
      if (vf.description) {
        lines.push(`${indent2}#   ${vf.description}`);
      }
    }
  }

  // Collect jsonData keys emitted by schema fields so we can detect extra keys in export mode.
  const emittedJsonDataKeys = new Set<string>();
  const emittedSecureJsonDataKeys = new Set<string>();

  // jsonData section — ordered by schema groups
  const jsonDataValues = values?.jsonData as Record<string, unknown> | undefined;
  const hasJsonDataFromSchema = jsonDataFieldsByGroup.length > 0;
  const hasJsonDataFromValues = !isTemplate && jsonDataValues && Object.keys(jsonDataValues).length > 0;

  if (hasJsonDataFromSchema || hasJsonDataFromValues) {
    lines.push(`${indent2}jsonData:`);

    // Schema-declared fields, grouped by section
    for (const { group, fields: groupFields } of jsonDataFieldsByGroup) {
      if (showComments && jsonDataFieldsByGroup.length > 1) {
        lines.push(`${indent3}# --- ${group.title} ---`);
      }
      for (const field of groupFields) {
        const val = values ? getNestedValue(values, 'jsonData', field) : templateValue(field);
        if (val === undefined || val === null) {
          continue;
        }
        // In export mode, skip default-value fields to keep YAML minimal
        if (!isTemplate && field.defaultValue !== undefined && val === field.defaultValue) {
          continue;
        }
        emittedJsonDataKeys.add(field.key);
        if (showComments) {
          lines.push(fieldComment(field, indent3));
        }
        const rendered = yamlValue(val, 4);
        if (rendered.startsWith('\n')) {
          lines.push(`${indent3}${field.key}:${rendered}`);
        } else {
          lines.push(`${indent3}${field.key}: ${rendered}`);
        }
      }
    }

    // In export mode, emit extra jsonData keys not declared in the schema
    // (e.g. httpHeaderName1 from indexedPair storage, or plugin-specific keys)
    if (!isTemplate && jsonDataValues) {
      for (const [key, val] of Object.entries(jsonDataValues)) {
        if (emittedJsonDataKeys.has(key)) {
          continue;
        }
        if (val === undefined || val === null) {
          continue;
        }
        const rendered = yamlValue(val, 4);
        if (rendered.startsWith('\n')) {
          lines.push(`${indent3}${key}:${rendered}`);
        } else {
          lines.push(`${indent3}${key}: ${rendered}`);
        }
      }
    }
  }

  // secureJsonData section
  // In export mode, the Grafana API returns `secureJsonFields: { key: true }` indicating which
  // secure fields are actually configured. Only emit those — not all schema-declared secure fields.
  // In template mode, emit all schema-declared secure fields with placeholders.
  const secureJsonFields = (values?.secureJsonFields ?? {}) as Record<string, boolean>;
  const inferredSecureKeys = !isTemplate ? inferSecureJsonDataKeys(jsonDataValues) : [];

  // Filter secure fields: in export mode, only emit fields that are actually set on the datasource
  const activeSecureFields = isTemplate
    ? allSecureJsonDataFields
    : allSecureJsonDataFields.filter((f) => secureJsonFields[f.key] === true);

  if (activeSecureFields.length > 0 || inferredSecureKeys.length > 0) {
    lines.push(`${indent2}secureJsonData:`);
    for (const field of activeSecureFields) {
      emittedSecureJsonDataKeys.add(field.key);
      if (showComments) {
        lines.push(fieldComment(field, indent3));
      }
      lines.push(`${indent3}${field.key}: ${secretPlaceholder(field)}`);
    }
    // Inferred secure keys (e.g. httpHeaderValue1 matching httpHeaderName1)
    for (const key of inferredSecureKeys) {
      if (emittedSecureJsonDataKeys.has(key)) {
        continue;
      }
      lines.push(`${indent3}${key}: xxxxxx`);
    }
  }

  return lines.join('\n');
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
    return toProvisioningYaml(schema, ds, { comments: false });
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
    lines.push('    jsonData:');
    for (const [key, val] of Object.entries(jsonData)) {
      const rendered = yamlValue(val, 4);
      if (rendered.startsWith('\n')) {
        lines.push(`      ${key}:${rendered}`);
      } else {
        lines.push(`      ${key}: ${rendered}`);
      }
    }
  }

  // secureJsonData is never returned by the API — emit placeholder comment
  lines.push('    # secureJsonData: (secrets are not exported — add manually)');
  lines.push('    #   mySecret: xxxxxx');

  return lines.join('\n');
}
