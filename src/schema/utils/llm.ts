import type { DatasourceConfigSchema } from '../schema';

/**
 * Generate LLM hints for select fields (used when creating datasources).
 */
export function generateLLMHint(schema: DatasourceConfigSchema): string {
  const hints: string[] = [];
  for (const field of schema.fields) {
    if (field.ui?.component !== 'select' || field.target !== 'jsonData' || field.kind === 'virtual') {
      continue;
    }
    const options = field.ui?.options ?? [];
    const values = options
      .map((opt) => {
        const isDefault = field.defaultValue != null && String(opt.value) === String(field.defaultValue);
        return isDefault ? `"${opt.value}" (default)` : `"${opt.value}"`;
      })
      .join(', ');
    if (values) {
      hints.push(`- ${field.label ?? field.key}: jsonData.${field.key} — values: ${values}`);
    }
  }
  return hints.join('\n');
}

/**
 * Generate comprehensive structured field data for troubleshooting context.
 * Returns an array of field descriptors the LLM can use to render rich tables.
 */
export function generateTroubleshootingFields(schema: DatasourceConfigSchema): Array<{
  label: string;
  key: string;
  target: string;
  type: string;
  required: boolean;
  description?: string;
  defaultValue?: unknown;
  options?: string[];
  section?: string;
  dependsOn?: string;
}> {
  const result: Array<{
    label: string;
    key: string;
    target: string;
    type: string;
    required: boolean;
    description?: string;
    defaultValue?: unknown;
    options?: string[];
    section?: string;
    dependsOn?: string;
  }> = [];
  for (const field of schema.fields) {
    if (field.kind === 'virtual' || field.isItemField) {
      continue;
    }
    const entry: (typeof result)[0] = {
      label: field.label ?? field.key,
      key: field.target === 'root' ? field.key : `${field.target}.${field.key}`,
      target: field.target ?? 'jsonData',
      type: field.valueType,
      required: !!field.required,
    };
    if (field.description) {
      entry.description = field.description;
    }
    if (field.defaultValue != null) {
      entry.defaultValue = field.defaultValue;
    }
    if (field.ui?.options && field.ui.options.length > 0) {
      entry.options = field.ui.options.map((o) => String(o.value));
    }
    if (field.section) {
      entry.section = field.section;
    }
    if (field.dependsOn) {
      entry.dependsOn = field.dependsOn;
    }
    result.push(entry);
  }
  return result;
}
