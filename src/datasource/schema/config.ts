/**
 * Datasource configuration schema types and pure helper functions.
 *
 * These types describe the structure of datasource plugin configuration schemas
 * (dsconfig format). Schemas define fields, groups, validations, and relationships
 * that drive the DatasourceConfigWizard UI and provisioning YAML generation.
 */

export type DatasourceConfigSchema = {
  schemaVersion: string;
  pluginType: string;
  pluginName: string;
  docURL?: string;
  fields: ConfigField[];
  groups?: ConfigGroup[];
  relationships?: FieldRelationship[];
};

export type ConfigField = {
  id: string;
  key: string;
  label?: string;
  description?: string;
  docURL?: string;
  valueType: ValueType;
  semanticType?: SemanticType;
  target?: TargetLocation;
  section?: string;
  kind?: FieldKind;
  isItemField?: boolean;
  lifecycle?: Lifecycle;
  ui?: FieldUI;
  validations?: FieldValidationRule[];
  dependsOn?: string;
  required?: boolean;
  requiredWhen?: string;
  disabledWhen?: string;
  overrides?: FieldOverride[];
  effects?: FieldEffect[];
  item?: FieldItemSchema;
  storage?: StorageMapping;
  tags?: string[];
  examples?: unknown[];
  defaultValue?: unknown;
};

export type FieldItemSchema = {
  valueType: ValueType;
  fields?: ConfigField[];
};

export type ValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'map' | 'any';
export type SemanticType = 'url' | 'password' | 'token' | 'hostname' | 'duration' | 'datasourceUid' | 'query';
export type FieldKind = 'storage' | 'virtual';
export type Lifecycle = 'stable' | 'deprecated' | 'experimental';
export type TargetLocation = 'root' | 'jsonData' | 'secureJsonData';

export type UIComponent =
  | 'input'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'code'
  | 'keyvalue'
  | 'list';

export type FieldUI = {
  component: UIComponent;
  multiline?: boolean;
  rows?: number;
  options?: FieldOption[];
  allowCustom?: boolean;
  width?: 'full' | 'half';
  placeholder?: string;
  language?: string;
};

export type FieldOption = {
  label: string;
  value: unknown;
  description?: string;
};

export type FieldValidationRule =
  | PatternValidation
  | RangeValidation
  | LengthValidation
  | ItemCountValidation
  | AllowedValuesValidation
  | CustomValidation;

type BaseValidation = {
  id?: string;
  message?: string;
};
export type PatternValidation = BaseValidation & {
  type: 'pattern';
  pattern: string;
};
export type RangeValidation = BaseValidation & {
  type: 'range';
  min?: number;
  max?: number;
};
export type LengthValidation = BaseValidation & {
  type: 'length';
  min?: number;
  max?: number;
};
export type ItemCountValidation = BaseValidation & {
  type: 'itemCount';
  min?: number;
  max?: number;
};
export type AllowedValuesValidation = BaseValidation & {
  type: 'allowedValues';
  values: unknown[];
};
export type CustomValidation = BaseValidation & {
  type: 'custom';
  expression: string;
};

export type FieldOverride = {
  when: string;
  defaultValue?: unknown;
  readOnly?: boolean;
  description?: string;
  placeholder?: string;
  tooltip?: string;
  validations?: FieldValidationRule[];
  options?: FieldOption[];
};

export type FieldEffect = {
  when: string;
  set: Record<string, unknown>;
};

export type StorageMapping = DirectMapping | IndexedPairMapping | ComputedMapping;
type DirectMapping = {
  type: 'direct';
};
type IndexedPairMapping = {
  type: 'indexedPair';
  key: MappingField;
  value: MappingField;
  startIndex?: number;
};
type ComputedMapping = {
  type: 'computed';
  read?: string;
  write?: string;
};
type MappingField = {
  target: TargetLocation;
  pattern: string;
};

export type ConfigGroup = {
  id: string;
  title: string;
  description?: string;
  order?: number;
  optional?: boolean;
  fieldRefs: string[];
};

export type FieldRelationship = {
  type: 'pair' | 'group' | 'datasourceReference';
  fields: string[];
  description?: string;
  targetPluginType?: string;
};

/**
 * Resolve a schema's groups into arrays of ConfigField objects.
 * If the schema has no groups, returns a single group containing all non-virtual fields.
 */
export function resolveGroups(schema: DatasourceConfigSchema): Array<{ group: ConfigGroup; fields: ConfigField[] }> {
  const fieldMap = new Map<string, ConfigField>();
  for (const f of schema.fields) {
    fieldMap.set(f.id, f);
  }

  if (schema.groups && schema.groups.length > 0) {
    return schema.groups
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((g) => ({
        group: g,
        fields: g.fieldRefs.map((ref) => fieldMap.get(ref)).filter((f): f is ConfigField => f != null),
      }));
  }

  // No groups: single step with all storage fields
  const allFields = schema.fields.filter((f) => f.kind !== 'virtual' && !f.isItemField);
  return [
    {
      group: { id: 'default', title: 'Configuration', fieldRefs: allFields.map((f) => f.id) },
      fields: allFields,
    },
  ];
}

/**
 * Build a virtual "Required" group containing all required fields, any parent
 * fields they depend on (via `dependsOn`), and any child fields that depend on
 * required fields.  When the schema contains an "auth" group, its fields are
 * also pulled in (auth is effectively required for Prometheus/Loki/Tempo style
 * datasources).  Fields are returned in schema order and de-duplicated.
 * Returns `null` when the virtual group would be empty.
 */
export function resolveRequiredFieldsGroup(
  schema: DatasourceConfigSchema
): { group: ConfigGroup; fields: ConfigField[] } | null {
  const fieldMap = new Map<string, ConfigField>();
  for (const f of schema.fields) {
    fieldMap.set(f.id, f);
  }

  const requiredIds = new Set<string>();
  for (const f of schema.fields) {
    if (f.required) {
      requiredIds.add(f.id);
    }
  }

  // Include all fields from the "auth" group as effectively required
  const authGroup = schema.groups?.find((g) => g.id === 'auth');
  if (authGroup) {
    for (const ref of authGroup.fieldRefs) {
      if (fieldMap.has(ref)) {
        requiredIds.add(ref);
      }
    }
  }

  if (requiredIds.size === 0) {
    return null;
  }

  const includeIds = new Set<string>();

  // Required fields + parent fields they depend on
  for (const id of requiredIds) {
    includeIds.add(id);
    const f = fieldMap.get(id);
    if (f?.dependsOn) {
      const parsed = parseDependsOn(f.dependsOn);
      if (parsed && fieldMap.has(parsed.field)) {
        includeIds.add(parsed.field);
      }
    }
  }

  // Child fields that depend on any required field
  for (const f of schema.fields) {
    if (f.dependsOn && !includeIds.has(f.id)) {
      const parsed = parseDependsOn(f.dependsOn);
      if (parsed && requiredIds.has(parsed.field)) {
        includeIds.add(f.id);
      }
    }
  }

  const virtualFields = schema.fields.filter((f) => includeIds.has(f.id));
  if (virtualFields.length === 0) {
    return null;
  }

  return {
    group: {
      id: '_required',
      title: 'Required',
      fieldRefs: virtualFields.map((f) => f.id),
    },
    fields: virtualFields,
  };
}

/**
 * Unique form key for a field. Section-scoped fields (e.g. section:"logs", key:"defaultTable")
 * get a prefixed key ("logs.defaultTable") so they don't collide with top-level fields that
 * share the same key name.
 */
export function formKey(field: ConfigField): string {
  return field.section ? `${field.section}.${field.key}` : field.key;
}

/**
 * Parse a simple CEL-like dependsOn expression: "fieldId == 'value'" or "fieldId == true".
 * Returns { field, value } or null if unparseable.
 */
export function parseDependsOn(expr: string): { field: string; value: string } | null {
  const m = expr.match(/^(.+?)\s*==\s*(?:'([^']*)'|"([^"]*)"|(.+))$/);
  if (!m) {
    return null;
  }
  return { field: m[1].trim(), value: (m[2] ?? m[3] ?? m[4]).trim() };
}

/**
 * Resolve the first matching override for a field given current form values.
 * Override `when` uses the same "fieldId == 'value'" syntax as dependsOn.
 * Returns the matching override or undefined if none match.
 */
export function resolveActiveOverride(
  field: ConfigField,
  watchedValues: Record<string, unknown>,
  fieldById: Map<string, ConfigField>
): FieldOverride | undefined {
  if (!field.overrides || field.overrides.length === 0) {
    return undefined;
  }
  for (const ov of field.overrides) {
    const parsed = parseDependsOn(ov.when);
    if (!parsed) {
      continue;
    }
    const depField = fieldById.get(parsed.field);
    const depKey = depField ? formKey(depField) : parsed.field;
    if (String(watchedValues[depKey] ?? '') === parsed.value) {
      return ov;
    }
  }
  return undefined;
}

/**
 * Resolve a field reference like "root.basicAuth" or "jsonData.oauthPassThru"
 * to its current value from a flat form values map, using the schema's field definitions.
 */
function resolveFieldValue(ref: string, values: Record<string, unknown>, fields: ConfigField[]): unknown {
  // Try direct match on formKey first
  if (ref in values) {
    return values[ref];
  }
  // Try matching by field ID → formKey
  const field = fields.find((f) => f.id === ref);
  if (field) {
    const fk = formKey(field);
    if (fk in values) {
      return values[fk];
    }
  }
  return undefined;
}

/**
 * Evaluate a simple computed.read expression against form values.
 * Supports patterns used in dsconfig schemas:
 *   - "fieldRef == true ? 'a' : (fieldRef == true ? 'b' : 'c')"
 *   - Simple ternary chains with equality checks
 * Falls back to the field's defaultValue if the expression can't be evaluated.
 */
export function evaluateComputedRead(expr: string, values: Record<string, unknown>, fields: ConfigField[]): unknown {
  // Recursively evaluate ternary: condition ? trueVal : falseVal
  function evalExpr(s: string): unknown {
    s = s.trim();

    // Strip outer parens
    if (s.startsWith('(') && findMatchingParen(s, 0) === s.length - 1) {
      s = s.slice(1, -1).trim();
    }

    // Ternary: find top-level "?"
    const qIdx = findTopLevel(s, '?');
    if (qIdx !== -1) {
      const condition = s.slice(0, qIdx).trim();
      const rest = s.slice(qIdx + 1);
      const cIdx = findTopLevel(rest, ':');
      if (cIdx !== -1) {
        const trueExpr = rest.slice(0, cIdx).trim();
        const falseExpr = rest.slice(cIdx + 1).trim();
        return evalCondition(condition) ? evalExpr(trueExpr) : evalExpr(falseExpr);
      }
    }

    // String literal
    const strMatch = s.match(/^'([^']*)'$/) ?? s.match(/^"([^"]*)"$/);
    if (strMatch) {
      return strMatch[1];
    }
    // Boolean/number literals
    if (s === 'true') {
      return true;
    }
    if (s === 'false') {
      return false;
    }
    if (/^-?\d+(\.\d+)?$/.test(s)) {
      return Number(s);
    }

    // Field reference
    return resolveFieldValue(s, values, fields);
  }

  function evalCondition(cond: string): boolean {
    // "ref == value" or "ref != value"
    const eqMatch = cond.match(/^(.+?)\s*(==|!=)\s*(.+)$/);
    if (eqMatch) {
      const left = evalExpr(eqMatch[1]);
      const right = evalExpr(eqMatch[3]);
      const eq = String(left) === String(right);
      return eqMatch[2] === '==' ? eq : !eq;
    }
    // Truthy check
    return !!evalExpr(cond);
  }

  function findMatchingParen(s: string, start: number): number {
    let depth = 0;
    for (let i = start; i < s.length; i++) {
      if (s[i] === '(') {
        depth++;
      } else if (s[i] === ')') {
        depth--;
        if (depth === 0) {
          return i;
        }
      }
    }
    return -1;
  }

  function findTopLevel(s: string, char: string): number {
    let depth = 0;
    let inStr: string | null = null;
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (inStr) {
        if (c === inStr) {
          inStr = null;
        }
        continue;
      }
      if (c === "'" || c === '"') {
        inStr = c;
        continue;
      }
      if (c === '(') {
        depth++;
        continue;
      }
      if (c === ')') {
        depth--;
        continue;
      }
      if (depth === 0 && c === char) {
        return i;
      }
    }
    return -1;
  }

  try {
    return evalExpr(expr);
  } catch {
    return undefined;
  }
}

/**
 * Compute initial values for all virtual fields that have storage.computed.read expressions.
 * Call after loading existing storage field values.
 */
export function computeVirtualFieldValues(
  schema: DatasourceConfigSchema,
  existingValues: Record<string, unknown>
): Record<string, unknown> {
  const virtualValues: Record<string, unknown> = {};
  for (const field of schema.fields) {
    if (field.kind !== 'virtual') {
      continue;
    }
    const fk = formKey(field);
    if (field.storage?.type === 'computed' && field.storage.read) {
      const val = evaluateComputedRead(field.storage.read, existingValues, schema.fields);
      if (val !== undefined) {
        virtualValues[fk] = val;
      } else if (field.defaultValue !== undefined) {
        virtualValues[fk] = field.defaultValue;
      }
    } else if (field.defaultValue !== undefined) {
      virtualValues[fk] = field.defaultValue;
    }
  }
  return virtualValues;
}
