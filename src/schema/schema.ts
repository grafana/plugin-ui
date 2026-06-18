// ============================================================
// Datasource Configuration Schema (TypeScript)
// ============================================================
//
// This schema defines datasource configuration in a declarative way.
//
// It is used for:
// - UI rendering
// - validation
// - storage mapping
// - documentation
// - LLM / automation tooling
//
// ============================================================

// ============================================================
// Root Schema
// ============================================================

export interface DatasourceConfigSchema {
  /**
   * Schema version (required)
   * Used for compatibility and migrations
   *
   * Example: "v2"
   */
  schemaVersion: string;

  /**
   * Unique datasource plugin identifier
   * Example: "prometheus"
   */
  pluginType: string;

  /**
   * Human-readable name
   */
  pluginName: string;

  /**
   * Optional documentation URL
   */
  docURL?: string;

  /**
   * Source of truth for configuration
   */
  fields: ConfigField[];

  /**
   * Optional UI grouping
   */
  groups?: ConfigGroup[];

  /**
   * Relationships between fields
   */
  relationships?: FieldRelationship[];
}

// ============================================================
// Field Definition
// ============================================================

export interface ConfigField {
  /**
   * Globally unique identifier
   * Recommended format: dot-separated path
   * Example: "auth.method", "httpHeaders.item.key"
   */
  id: string;

  /**
   * Local key used in storage or object
   */
  key: string;

  /**
   * UI metadata
   */
  label?: string;
  description?: string;
  docURL?: string;

  /**
   * Core type of the field
   */
  valueType: ValueType;

  /**
   * Storage location (required for storage fields)
   */
  target?: TargetLocation;

  /**
   * Dotted path prefix within the target for nested objects.
   * Example: for jsonData.tracesToLogs.datasourceUid,
   * target="jsonData", section="tracesToLogs", key="datasourceUid".
   */
  section?: string;

  /**
   * Field kind.
   * @default "storage"
   */
  kind?: FieldKind;

  /**
   * True if field belongs to array item schema
   */
  isItemField?: boolean;

  /**
   * UI rendering hints
   */
  ui?: FieldUI;

  /**
   * Validations rules
   */
  validations?: FieldValidationRule[];

  /**
   * Visibility condition (CEL expression)
   */
  dependsOn?: Expression;

  /**
   * Always required
   */
  required?: boolean;

  /**
   * Conditionally required
   */
  requiredWhen?: Expression;

  /**
   * Disabled condition
   */
  disabledWhen?: Expression;

  /**
   * Dynamic overrides
   */
  overrides?: FieldOverride[];

  /**
   * Declarative multi-field write side-effects.
   * When this field's value matches a condition, the listed target
   * fields are set to specified values. Typically used on virtual
   * selector fields (e.g. auth method dropdown).
   */
  effects?: FieldEffect[];

  /**
   * Item schema for array elements or map values.
   * Required if valueType === "array" or "map".
   */
  item?: FieldItemSchema;

  /**
   * Legacy indexed fields (deprecated)
   */
  repeatable?: boolean;
  pattern?: string;

  /**
   * Storage mapping
   */
  storage?: StorageMapping;

  /**
   * Metadata
   */
  tags?: string[];
  examples?: unknown[];
  defaultValue?: unknown;
}

// ============================================================
// Array Item Schema
// ============================================================

export interface FieldItemSchema {
  /**
   * Type of array items or map values.
   * For arrays, describes each element.
   * For maps, describes each value (keys are always strings).
   */
  valueType: ValueType;

  /**
   * Sub-fields for object items. Optional even when valueType = "object"
   * (omitting allows an unconstrained object).
   */
  fields?: ConfigField[];
}

// ============================================================
// Expressions
// ============================================================

/**
 * CEL expression string
 */
export type Expression = string;

// ============================================================
// Value Types
// ============================================================

export type ValueType = 'string' | 'number' | 'boolean' | 'array' | 'object' | 'map' | 'any';

// ============================================================
// Field Kind
// ============================================================

export type FieldKind = 'storage' | 'virtual';

// ============================================================
// Target Location
// ============================================================

export type TargetLocation = 'root' | 'jsonData' | 'secureJsonData';

// ============================================================
// UI Components
// ============================================================

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
  | 'list'
  | 'fileUpload';

export type UIWidth = 'full' | 'half';

/**
 * UI configuration
 */
export interface FieldUI {
  component: UIComponent;

  multiline?: boolean;
  rows?: number;

  options?: FieldOption[];
  allowCustom?: boolean;

  width?: UIWidth;

  placeholder?: string;

  /**
   * Language hint for code editor components.
   * Example: "promql", "logql", "traceql", "sql", "json"
   */
  language?: string;

  /**
   * Layout row index for item fields inside object arrays.
   * Fields with the same row number are rendered horizontally.
   * Fields without a row number use auto-layout:
   * - ≤3 fields: all on one row
   * - >3 fields: each on its own row
   */
  row?: number;

  /**
   * Accepted file types for fileUpload component.
   * Uses HTML accept attribute format with leading dot.
   * Example: [".json"]
   */
  accept?: string[];

  /**
   * Maps keys in an uploaded JSON file to target field IDs.
   * Used by fileUpload to distribute parsed values to other form fields.
   * Example: { "private_key": "secureJsonData.privateKey", "client_email": "jsonData.clientEmail" }
   */
  fileMapping?: Record<string, string>;
}

// ============================================================
// Validations
// ============================================================

export type FieldValidationRule =
  | PatternValidationRule
  | RangeValidationRule
  | LengthValidationRule
  | ItemCountValidationRule
  | AllowedValuesValidationRule
  | CustomValidationRule;

export interface BaseValidationRule {
  /**
   * Optional stable ID for the validation rule.
   * Useful for docs, localization, and test snapshots.
   */
  id?: string;

  /**
   * Human-readable validation error message.
   */
  message?: string;
}

export interface PatternValidationRule extends BaseValidationRule {
  type: 'pattern';
  pattern: string;
}

export interface RangeValidationRule extends BaseValidationRule {
  type: 'range';
  min?: number;
  max?: number;
}

export interface LengthValidationRule extends BaseValidationRule {
  type: 'length';
  min?: number;
  max?: number;
}

export interface ItemCountValidationRule extends BaseValidationRule {
  type: 'itemCount';
  min?: number;
  max?: number;
}

export interface AllowedValuesValidationRule extends BaseValidationRule {
  type: 'allowedValues';
  values: unknown[];
}

export interface CustomValidationRule extends BaseValidationRule {
  type: 'custom';

  /**
   * CEL expression.
   *
   * Should evaluate to true when the field value is valid.
   */
  expression: Expression;
}
// ============================================================
// Overrides
// ============================================================

export interface FieldOverride {
  /**
   * CEL condition
   */
  when: Expression;

  defaultValue?: unknown;

  /**
   * When true, the field is disabled/read-only while this override is active.
   */
  readOnly?: boolean;
  description?: string;
  placeholder?: string;
  tooltip?: string;

  validations?: FieldValidationRule[];
  options?: FieldOption[];

  /**
   * When present on an `isItemField` field, the value is routed to
   * `secureJsonData` under the resolved key instead of being stored
   * inline in the parent array.
   *
   * The template string supports placeholders:
   * - `{index}`  — 0-based array position
   * - `{index1}` — 1-based array position
   * - `{item.KEY}` — value of sibling item field `KEY`
   *
   * Examples:
   * - `"secureHttpHeaders.{item.name}"` (ClickHouse)
   * - `"httpHeaderValue{index1}"` (Grafana core headers)
   */
  secureKey?: string;
}

// ============================================================
// Effects
// ============================================================

/**
 * Declares that when a field's value matches a condition,
 * listed target fields should be set to specified values.
 *
 * Use "value" in the `when` expression to refer to the field's value.
 */
export interface FieldEffect {
  /**
   * CEL expression. Example: "value == 'basic-auth'"
   */
  when: Expression;

  /**
   * Maps field IDs to the values they should be set to.
   * Must contain at least one entry.
   */
  set: Record<string, unknown> & { [k: string]: unknown };
}

// ============================================================
// Storage Mapping
// ============================================================

export type StorageMapping = DirectMapping | IndexedPairMapping | ComputedMapping;

/**
 * Direct mapping
 */
export interface DirectMapping {
  type: 'direct';
}

/**
 * Indexed pair mapping (headers)
 */
export interface IndexedPairMapping {
  type: 'indexedPair';

  key: MappingField;
  value: MappingField;

  startIndex?: number;
}

/**
 * Computed mapping (virtual fields).
 * At least one of `read` or `write` must be provided.
 */
export type ComputedMapping =
  | { type: 'computed'; read: Expression; write?: Expression }
  | { type: 'computed'; read?: Expression; write: Expression };

/**
 * Mapping field
 */
export interface MappingField {
  target: TargetLocation;
  pattern: string;
}

// ============================================================
// Options
// ============================================================

export interface FieldOption {
  label: string;

  /**
   * Must match parent field valueType.
   * Must not be null.
   */
  value: NonNullable<unknown>;

  /**
   * Optional human-readable description of the option.
   */
  description?: string;
}

// ============================================================
// Groups
// ============================================================

export interface ConfigGroup {
  id: string;
  title: string;
  description?: string;
  order?: number;

  /**
   * When true, the group is optional and can be collapsed/hidden by default.
   */
  optional?: boolean;

  /**
   * References field IDs (not keys)
   */
  fieldRefs: string[];
}

// ============================================================
// Relationships
// ============================================================

export type RelationshipType = 'pair' | 'group' | 'datasourceReference';

export interface FieldRelationship {
  type: RelationshipType;

  /**
   * References field IDs
   */
  fields: string[];

  description?: string;

  /**
   * Constrains the datasource UID to a specific plugin type.
   * Only applicable when type is "datasourceReference".
   */
  targetPluginType?: string;
}

// ============================================================
// Runtime Types (UI Layer)
// ============================================================

export type SecureFieldState = { type: 'unset' } | { type: 'configured' } | { type: 'updated'; value: string };

export interface FormState {
  values: Record<string, unknown>;
  secure: Record<string, SecureFieldState>;
}
