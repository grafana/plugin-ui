# Datasource Configuration Schema

Declarative schema for Grafana datasource configuration.

- Single source of truth for datasource config: UI, validation, storage mapping, docs, and LLM tooling
- Language-neutral contract:TypeScript and JSON Schema all describe the same model
- Support the existing Grafana datasource config shape without changing it

## Root schema

| name          | type                | required  | description                                   |
| ------------- | ------------------- | --------- | --------------------------------------------- |
| schemaVersion | string              | Required. | Schema spec version (e.g. "v1").              |
| pluginType    | string              | Required. | Unique plugin identifier (e.g. "prometheus"). |
| pluginName    | string              | Required. | Human-readable name.                          |
| docURL        | string              | Optional  | documentation URL.                            |
| fields        | ConfigField[]       | Required. | Source of truth for all config fields.        |
| groups        | ConfigGroup[]       | Optional  | UI layout grouping.                           |
| relationships | FieldRelationship[] | Optional  | semantic relationships between fields.        |

## Field identity: `id` vs `key`

| Property | Purpose                    | Scope                                        | Example                   |
| -------- | -------------------------- | -------------------------------------------- | ------------------------- |
| `id`     | Canonical schema reference | Globally unique across the entire schema     | `"httpHeaders.item.name"` |
| `key`    | Storage/object key         | Local to its storage target or parent object | `"name"`                  |

Groups and relationships reference fields by `id`.

## Storage target

`target` specifies where the field is stored in Grafana's datasource config:

| Value            | Maps to                                     |
| ---------------- | ------------------------------------------- |
| `root`           | Top-level fields (`url`, `basicAuth`, etc.) |
| `jsonData`       | `jsonData.*`                                |
| `secureJsonData` | `secureJsonData.*` (write-only)             |

**Required** for storage fields. **Omitted** for virtual fields and item fields.

### Secure fields

Fields targeting `secureJsonData` are **write-only**. When reading existing config, consumers should use `secureJsonFields` (a `Record<string, boolean>`) to determine whether a secret is already configured. The schema describes the field; it does not imply the secret value is retrievable.

## Storage mapping

The `storage` property defines how logical fields map to Grafana's legacy storage format.

| Type          | Description                                                                    |
| ------------- | ------------------------------------------------------------------------------ |
| `direct`      | Default. `target` + `key` maps directly.                                       |
| `indexedPair` | Legacy indexed key/value pattern (e.g. `httpHeaderName1`, `httpHeaderValue1`). |
| `computed`    | Declarative read/write expressions. Execution is runtime-specific.             |

`computed` mappings store CEL-like expressions but are **not evaluated** by the schema validator.

## Validation rules

`validations[]` defines the **data contract**. `ui.options` defines **presentation**.

```json
{
  "validations": [{ "type": "allowedValues", "values": ["GET", "POST"] }],
  "ui": {
    "component": "select",
    "options": [
      { "label": "GET", "value": "GET" },
      { "label": "POST", "value": "POST" }
    ]
  }
}
```

Tools, docs generators, provisioning, and LLM integrations should use `validations[]` — not `ui.options` — as the source of truth for allowed values.

## UI components

`ui.component` supports the following values:

| Value        | Purpose                                        |
| ------------ | ---------------------------------------------- |
| `input`      | Single-line text/number input                  |
| `textarea`   | Multi-line text                                |
| `select`     | Single-select dropdown                         |
| `multiselect`| Multi-select dropdown                          |
| `radio`      | Radio option group                             |
| `checkbox`   | Boolean checkbox                               |
| `switch`     | Boolean switch/toggle                           |
| `code`       | Code editor input                              |
| `keyvalue`   | Key-value editor                               |
| `list`       | List editor                                    |
| `fileUpload` | File upload input (supports `accept` mapping)  |

### Rule types

| Type            | Required fields    | Purpose                               |
| --------------- | ------------------ | ------------------------------------- |
| `pattern`       | `pattern`          | Regex validation for strings          |
| `range`         | `min` and/or `max` | Numeric bounds                        |
| `length`        | `min` and/or `max` | String length bounds                  |
| `itemCount`     | `min` and/or `max` | Array size bounds                     |
| `allowedValues` | `values`           | Enumerated allowed values             |
| `custom`        | `expression`       | CEL expression (evaluated at runtime) |

## Map fields

When `valueType` is `"map"`, the field represents a `Record<string, T>` — an object with dynamic string keys. Like arrays, maps require an `item` property that describes the value type:

```json
{
  "id": "jsonData.labels",
  "key": "labels",
  "valueType": "map",
  "target": "jsonData",
  "item": { "valueType": "string" }
}
```

For maps with structured values (`Record<string, SomeObject>`):

```json
{
  "id": "jsonData.customizedRoutes",
  "key": "customizedRoutes",
  "valueType": "map",
  "target": "jsonData",
  "item": {
    "valueType": "object",
    "fields": [
      {
        "id": "customizedRoutes.item.URL",
        "key": "URL",
        "valueType": "string",
        "isItemField": true
      },
      {
        "id": "customizedRoutes.item.Scopes",
        "key": "Scopes",
        "valueType": "array",
        "isItemField": true,
        "item": { "valueType": "string" }
      }
    ]
  }
}
```

Map keys are always strings (JSON constraint). The `item` schema describes the **values**.

## Any fields

When `valueType` is `"any"`, the field accepts multiple runtime types (e.g. `string | string[]`). Use sparingly — only for genuinely polymorphic fields where a single type cannot describe the data:

```json
{
  "id": "search.filters.item.value",
  "key": "value",
  "valueType": "any",
  "isItemField": true,
  "description": "Filter value. May be a single string or array of strings."
}
```

Fields with `valueType: "any"` do not require an `item` property and skip type-level validation. Consumers should document the expected shapes in the `description`.

## Array item fields

When `valueType` is `"array"`, the field must have an `item` property:

```json
{
  "valueType": "array",
  "item": {
    "valueType": "object",
    "fields": [
      {
        "id": "headers.item.name",
        "key": "name",
        "valueType": "string",
        "isItemField": true
      }
    ]
  }
}
```

- `item.fields` is only allowed when `item.valueType` is `"object"`
- Every field inside `item.fields` **must** have `isItemField: true`
- Item fields do not require `target` (they inherit storage from the parent)

## Virtual fields

Fields with `kind: "virtual"` are derived/computed and not stored directly:

```json
{
  "id": "derived.hasAuth",
  "key": "hasAuth",
  "valueType": "boolean",
  "kind": "virtual"
}
```

Virtual fields:

- Do not require `target`
- May have a `computed` storage mapping with `read`/`write` expressions
- Are useful for UI state that doesn't map 1:1 to storage

## Effects: virtual selector → multi-field writes

Many datasources have a **selector dropdown** (e.g. "Authentication method") that controls **multiple storage fields** simultaneously. The `effects` array provides a structured, machine-readable way to declare these side-effects without opaque CEL expressions.

```json
{
  "id": "auth.method",
  "kind": "virtual",
  "defaultValue": "no-auth",
  "validations": [
    {
      "type": "allowedValues",
      "values": ["no-auth", "basic-auth", "forward-oauth"]
    }
  ],
  "ui": {
    "component": "select",
    "options": [
      { "label": "No Authentication", "value": "no-auth" },
      { "label": "Basic authentication", "value": "basic-auth" },
      { "label": "Forward OAuth Identity", "value": "forward-oauth" }
    ]
  },
  "storage": {
    "type": "computed",
    "read": "root.basicAuth == true ? 'basic-auth' : (jsonData.oauthPassThru == true ? 'forward-oauth' : 'no-auth')"
  },
  "effects": [
    {
      "when": "value == 'no-auth'",
      "set": { "auth.basicAuth": false, "auth.oauthPassThru": false }
    },
    {
      "when": "value == 'basic-auth'",
      "set": { "auth.basicAuth": true, "auth.oauthPassThru": false }
    },
    {
      "when": "value == 'forward-oauth'",
      "set": { "auth.basicAuth": false, "auth.oauthPassThru": true }
    }
  ]
}
```

### Effect rules

| Property | Type                     | Required | Description                                                            |
| -------- | ------------------------ | -------- | ---------------------------------------------------------------------- |
| `when`   | string (CEL)             | Yes      | Condition. Use `value` to refer to the field's current value.          |
| `set`    | `Record<fieldId, value>` | Yes      | Maps field IDs to the values they should be set to. Must not be empty. |

### How effects work with other primitives

- **`storage.computed.read`**: Derives the virtual field's value when loading existing config.
- **`effects[].set`**: Declares what to write when the virtual field changes.
- **`dependsOn`**: On target storage fields, controls visibility (e.g. show username only when `auth.method == 'basic-auth'`).
- **`requiredWhen`**: On target storage fields, conditional validation.
- **`tags: ["managed-by:auth.method"]`**: Convention for tagging fields that are driven by a selector.
- **`tags: ["pinned"]`**: Promotes a field into the "General" virtual group so it appears in the common section at the top of both wizard and tab modes, regardless of which group it belongs to. Use for fields like Base URL or Allowed Hosts that users always need quick access to.

Effects keys (`set`) reference field **IDs**, consistent with groups and relationships. They are validated against the schema's field ID set.

## Condition expressions

The properties `dependsOn`, `requiredWhen`, `disabledWhen`, and `overrides[].when` use [Common Expression Language (CEL)](https://github.com/google/cel-spec) syntax. The evaluator is `@marcbachmann/cel-js` (TypeScript) with `cel-go` as the Go equivalent.

### Supported syntax

```
fieldRef == 'value'                             // simple equality
fieldRef != 'value'                             // inequality
fieldRef == true                                // boolean
fieldA == 'x' && fieldB == 'y'                  // AND
fieldA == 'x' || fieldA == 'y'                  // OR
(fieldA == 'x' || fieldA == 'y') && fieldB      // parentheses + grouping
!fieldRef                                       // negation
has(config.auth)                                // field existence check
size(items) > 0                                 // array length
'admin' in roles                                // list membership
```

| Feature               | Supported | Example                                                                       |
| --------------------- | --------- | ----------------------------------------------------------------------------- |
| Equality (`==`)       | Yes       | `jsonData.auth_method == 'oauth2'`                                            |
| Inequality (`!=`)     | Yes       | `jsonData.auth_method != 'none'`                                              |
| Logical AND (`&&`)    | Yes       | `jsonData.auth_method == 'oauth2' && jsonData.oauth2.oauth2_type == 'jwt'`    |
| Logical OR (`\|\|`)   | Yes       | `jsonData.auth_method == 'oauth2' \|\| jsonData.auth_method == 'bearerToken'` |
| Parentheses           | Yes       | `(method == 'basic' \|\| method == 'digest') && enabled == true`              |
| Negation (`!`)        | Yes       | `!enabled`, `!(method == 'none')`                                             |
| Single-quoted strings | Yes       | `fieldRef == 'value'`                                                         |
| Double-quoted strings | Yes       | `fieldRef == "value"`                                                         |
| Boolean literals      | Yes       | `fieldRef == true`                                                            |
| Numeric comparison    | Yes       | `count > 5`, `count >= 0`                                                     |
| `in` operator         | Yes       | `'admin' in roles`                                                            |
| `has()` macro         | Yes       | `has(config.auth)`                                                            |
| `size()` macro        | Yes       | `size(items) > 0`                                                             |
| Ternary               | Yes       | `enabled ? 'yes' : 'no'` (in computed expressions)                            |

### Field references

The left-hand side of comparisons uses **field IDs** — dotted identifiers that CEL interprets as nested property access.

| Pattern              | What it references      | Example                                | CEL context shape                                  |
| -------------------- | ----------------------- | -------------------------------------- | -------------------------------------------------- |
| `key`                | Top-level field by key  | `tlsAuth == true`                      | `{ tlsAuth: true }`                                |
| `target.key`         | Field by target and key | `jsonData.auth_method == 'oauth2'`     | `{ jsonData: { auth_method: 'oauth2' } }`          |
| `target.section.key` | Section-scoped field    | `jsonData.oauth2.oauth2_type == 'jwt'` | `{ jsonData: { oauth2: { oauth2_type: 'jwt' } } }` |

**Context building**: The wizard automatically builds a nested CEL context from flat form values using field ID paths. Schema authors write expressions against field IDs; the context nesting is handled by the framework.

**Special characters**: Field IDs may contain dots (`.`) and underscores (`_`) but should avoid hyphens, spaces, or brackets. Use underscores for multi-word names (e.g. `oauth2_type`, not `oauth2-type`).

### Common patterns

**Show field for one auth method:**

```json
{ "dependsOn": "jsonData.auth_method == 'oauth2'" }
```

**Show field for multiple auth methods (OR):**

```json
{ "dependsOn": "jsonData.auth_method == 'oauth2' || jsonData.auth_method == 'bearerToken'" }
```

**Require field only for specific grant type (compound AND):**

```json
{ "requiredWhen": "jsonData.auth_method == 'oauth2' && jsonData.oauth2.oauth2_type == 'client_credentials'" }
```

**Show field when parent is enabled AND a specific mode:**

```json
{ "dependsOn": "(jsonData.proxy_type == 'url' || jsonData.proxy_type == 'socks') && jsonData.proxyAuth == true" }
```

### Transitive visibility

When field B has `dependsOn: "fieldA == 'x'"`, and field C has `dependsOn: "fieldB == 'y'"`, field C is automatically hidden when field A's value hides field B. The evaluator checks all referenced fields in the expression and ensures their parent dependencies are also satisfied.

```json
// Field A: auth_method selector (always visible)
{ "id": "jsonData.auth_method", "..." : "..." }

// Field B: visible only when auth_method == 'oauth2'
{ "id": "jsonData.oauth2.oauth2_type", "dependsOn": "jsonData.auth_method == 'oauth2'" }

// Field C: visible when oauth2_type == 'jwt' — transitively hidden when auth_method != 'oauth2'
{ "id": "jsonData.oauth2.email", "dependsOn": "jsonData.oauth2.oauth2_type == 'jwt'" }
```

### Go compatibility

The Go backend can evaluate the same expressions using [`cel-go`](https://github.com/google/cel-go) (Google's official CEL implementation). Both libraries implement the same [CEL spec](https://github.com/google/cel-spec), ensuring expression parity between frontend and backend.

## Modeling patterns

### Recursive types

TypeScript types that reference themselves (e.g. `AzureCredentials.serviceCredentials?: AzureCredentials`) should be **flattened** using `section` with dotted paths. In practice, recursion is always bounded to a known depth:

```json
[
  {
    "id": "auth.credentials.authType",
    "key": "authType",
    "target": "jsonData",
    "section": "azureCredentials",
    "valueType": "string"
  },
  {
    "id": "auth.credentials.tenantId",
    "key": "tenantId",
    "target": "jsonData",
    "section": "azureCredentials",
    "valueType": "string"
  },
  {
    "id": "auth.svcCreds.authType",
    "key": "authType",
    "target": "jsonData",
    "section": "azureCredentials.serviceCredentials",
    "valueType": "string"
  },
  {
    "id": "auth.svcCreds.tenantId",
    "key": "tenantId",
    "target": "jsonData",
    "section": "azureCredentials.serviceCredentials",
    "valueType": "string"
  }
]
```

### Per-item secure fields

Some datasources have arrays where individual items may conditionally store their value in `secureJsonData` (e.g. ClickHouse HTTP headers with a `secure` toggle, or Grafana core headers that are always secret).

Use `overrides[].secureKey` on the item field whose value needs routing. The `secureKey` is a template string with placeholders:

| Placeholder  | Resolves to                       |
| ------------ | --------------------------------- |
| `{index}`    | 0-based array position            |
| `{index1}`   | 1-based array position            |
| `{item.KEY}` | Value of sibling item field `KEY` |

#### Conditionally secure (ClickHouse pattern)

The header value goes to `secureJsonData` only when `item.secure == true`. The key is derived from the header name:

```json
{
  "id": "httpHeaders.item.value",
  "key": "value",
  "valueType": "string",
  "isItemField": true,
  "overrides": [
    {
      "when": "item.secure == true",
      "secureKey": "secureHttpHeaders.{item.name}"
    }
  ]
}
```

On save, when `item.secure` is true:

- `secureJsonData["secureHttpHeaders.Authorization"] = "secret"` (value moved here)
- `secureJsonFields["secureHttpHeaders.Authorization"] = true`
- `jsonData.httpHeaders[].value` is set to `""` (cleared from the array)

On load, when `secureJsonFields["secureHttpHeaders.Authorization"]` is true, the UI shows a masked SecretInput with a Reset button.

#### Always secure (Grafana core headers pattern)

Every header value is a secret. The key uses the 1-based array index:

```json
{
  "id": "headers.item.value",
  "key": "value",
  "valueType": "string",
  "isItemField": true,
  "overrides": [
    {
      "when": "true",
      "secureKey": "httpHeaderValue{index1}"
    }
  ]
}
```

## Groups and relationships

**Groups** define UI layout sections. They reference fields by `id`.
Set `"optional": true` on groups that can be collapsed or hidden by default (e.g. advanced sections):

```json
{
  "id": "auth",
  "title": "Authentication",
  "fieldRefs": ["auth.user", "auth.password"]
}
```

**Relationships** define semantic connections between fields:

```json
{
  "type": "pair",
  "fields": ["auth.user", "auth.password"],
  "description": "Credentials"
}
```

`FieldRelationship.type` supports:

| Value                 | Meaning                                                       |
| --------------------- | ------------------------------------------------------------- |
| `pair`                | Two (or more) fields that belong together semantically        |
| `group`               | A conceptual grouping relationship (non-layout metadata)      |
| `datasourceReference` | A field references another datasource (optionally constrained by `targetPluginType`) |

Groups and relationships are metadata — they do not affect storage or validation.

## Lifecycle

Fields can be marked with a lifecycle stage:

| Value          | Meaning                             |
| -------------- | ----------------------------------- |
| `stable`       | Production-ready                    |
| `deprecated`   | Will be removed in a future version |
| `experimental` | Subject to change                   |

## Expression language

Expression fields (`dependsOn`, `requiredWhen`, `disabledWhen`, `overrides[].when`, `storage.computed.read/write`, `custom` validation `expression`) are **opaque strings** in v1. The intended language is CEL. This PR stores expressions but **does not evaluate them**. Runtime evaluation is follow-up work.
