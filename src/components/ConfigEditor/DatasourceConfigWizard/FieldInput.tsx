import React from 'react';
import type { ConfigField } from '../../../schema/schema';
import type { IndexedPairItem } from './datasource';
import type { FieldInputProps } from './inputs/types';
import { SecureFieldInput } from './inputs/SecureFieldInput';
import { StringArrayInput } from './inputs/StringArrayInput';
import { IndexedPairEditor } from './inputs/IndexedPairEditor';
import { FileUploadField } from './inputs/FileUploadField';
import { ObjectArrayEditor } from './inputs/ObjectArrayEditor';
import { ComplexFieldNote } from './inputs/ComplexFieldNote';
import { TextInput, NumberInput, BooleanInput, TextAreaInput, SelectInput, RadioInput } from './inputs/PrimitiveInputs';

export type { FieldInputProps };

/** Discriminant identifying which input component renders a field. */
export type FieldInputKind =
  | 'fileUpload'
  | 'secure'
  | 'radio'
  | 'select'
  | 'boolean'
  | 'number'
  | 'textarea'
  | 'indexedPair'
  | 'stringArray'
  | 'objectArray'
  | 'complex'
  | 'text';

/**
 * Resolve a field to its input kind.
 *
 * Order matters: earlier rules win. Cross-cutting storage concerns (secure
 * storage, indexed-pair storage) intentionally take precedence over
 * `valueType`, and an explicit `ui.component` (radio/select/textarea) takes
 * precedence over the type-derived default. `fileUpload` requires `setValue`
 * because it distributes parsed values across sibling fields.
 */
export function resolveFieldInputKind(field: ConfigField, hasSetValue: boolean): FieldInputKind {
  if (field.ui?.component === 'fileUpload' && field.ui.fileMapping && hasSetValue) {
    return 'fileUpload';
  }
  if (field.target === 'secureJsonData') {
    return 'secure';
  }
  if (field.ui?.component === 'radio') {
    return 'radio';
  }
  if (field.ui?.component === 'select') {
    return 'select';
  }
  if (field.valueType === 'boolean') {
    return 'boolean';
  }
  if (field.valueType === 'number') {
    return 'number';
  }
  if (field.ui?.component === 'textarea') {
    return 'textarea';
  }
  if (field.storage?.type === 'indexedPair') {
    return 'indexedPair';
  }
  if (field.valueType === 'array' && field.item?.valueType === 'string') {
    return 'stringArray';
  }
  if (field.valueType === 'array' && field.item?.valueType === 'object' && field.item.fields?.length) {
    return 'objectArray';
  }
  if (
    field.valueType === 'object' ||
    field.valueType === 'map' ||
    (field.valueType === 'array' && (field.item?.valueType === 'object' || field.item?.valueType === 'map'))
  ) {
    return 'complex';
  }
  return 'text';
}

// ── Adapters: map the normalized FieldInputProps onto each leaf component's own API ──

/** Password/token stored in secureJsonData. */
function SecureInput({ field, formField, disabled }: FieldInputProps) {
  const label = field.label ?? field.key;
  return (
    <SecureFieldInput
      formField={formField}
      placeholder={field.ui?.placeholder ?? label}
      disabled={disabled}
      label={label}
    />
  );
}

/** JSON file upload that distributes parsed keys across sibling fields. */
function FileUploadInput({ field, formField, disabled, setValue }: FieldInputProps) {
  // Only reachable when setValue exists (see resolveFieldInputKind), but guard anyway.
  if (!setValue) {
    return null;
  }
  return <FileUploadField field={field} formField={formField} disabled={disabled} setValue={setValue} />;
}

/** Editable key/value list backed by indexed storage (e.g. HTTP headers). */
function IndexedPairInput({ field, formField, disabled }: FieldInputProps) {
  const items = Array.isArray(formField.value) ? (formField.value as IndexedPairItem[]) : [];
  const maxItems =
    field.validations?.find((v): v is { type: 'itemCount'; max?: number } => v.type === 'itemCount')?.max ?? 10;
  const itemLabel = field.label?.toLowerCase().replace(/s$/, '') ?? 'header';
  return (
    <IndexedPairEditor
      value={items}
      onChange={formField.onChange}
      maxItems={maxItems}
      disabled={disabled}
      itemLabel={itemLabel}
    />
  );
}

/** Row-based editor for an array of strings. */
function StringArrayField({ field, formField, disabled }: FieldInputProps) {
  const label = field.label ?? field.key;
  return (
    <StringArrayInput
      value={Array.isArray(formField.value) ? (formField.value as string[]) : []}
      onChange={formField.onChange}
      placeholder={field.ui?.placeholder}
      disabled={disabled}
      itemLabel={label.toLowerCase().replace(/s$/, '')}
    />
  );
}

/** Inline editor for an array of objects with defined item fields. */
function ObjectArrayInput({ field, formField, disabled, errorMessage }: FieldInputProps) {
  return (
    <ObjectArrayEditor
      field={field}
      value={formField.value}
      onChange={formField.onChange}
      disabled={disabled}
      errorMessage={errorMessage}
    />
  );
}

/** Read-only note for complex shapes not editable in the wizard. */
function ComplexInput({ field, formField }: FieldInputProps) {
  const label = field.label ?? field.key;
  const count = Array.isArray(formField.value) ? formField.value.length : 0;
  return <ComplexFieldNote count={count} label={label} />;
}

/** Registry mapping each resolved kind to its renderer. */
const FIELD_INPUTS: Record<FieldInputKind, React.ComponentType<FieldInputProps>> = {
  fileUpload: FileUploadInput,
  secure: SecureInput,
  radio: RadioInput,
  select: SelectInput,
  boolean: BooleanInput,
  number: NumberInput,
  textarea: TextAreaInput,
  indexedPair: IndexedPairInput,
  stringArray: StringArrayField,
  objectArray: ObjectArrayInput,
  complex: ComplexInput,
  text: TextInput,
};

/**
 * Render the appropriate input for a schema field.
 *
 * Replaces the former `renderFieldInput` switch with a resolver + component
 * registry: each input is an independently testable component, and adding a
 * new input means extending the registry rather than editing a growing
 * conditional.
 */
export function FieldInput(props: FieldInputProps) {
  const kind = resolveFieldInputKind(props.field, props.setValue !== undefined);
  const Component = FIELD_INPUTS[kind];
  return <Component {...props} />;
}
