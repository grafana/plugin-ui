import React from 'react';
import type { IndexedPairItem } from '../datasource';
import type { FieldInputProps } from './types';
import { SecureFieldInput } from './SecureFieldInput';
import { StringArrayInput } from './StringArrayInput';
import { IndexedPairEditor } from './IndexedPairEditor';
import { FileUploadField } from './FileUploadField';
import { ObjectArrayEditor } from './ObjectArrayEditor';
import { ComplexFieldNote } from './ComplexFieldNote';
import { TextInput, NumberInput, BooleanInput, TextAreaInput, SelectInput, RadioInput } from './PrimitiveInputs';
import { type FieldInputKind, resolveFieldInputKind } from './fieldUtils';

export type { FieldInputProps };

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
