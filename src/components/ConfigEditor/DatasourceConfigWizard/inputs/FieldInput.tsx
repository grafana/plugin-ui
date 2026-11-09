import React from 'react';
import { TextInput, NumberInput, BooleanInput, TextAreaInput, SelectInput, RadioInput } from './PrimitiveInputs';
import { SecureInput } from './SecureFieldInput';
import { StringArrayField } from './StringArrayInput';
import { IndexedPairInput } from './IndexedPairEditor';
import { FileUploadInput } from './FileUploadField';
import { ObjectArrayInput } from './ObjectArrayEditor';
import { ComplexInput } from './ComplexFieldNote';
import { type ConfigField } from './../../../../schema';
import { type FieldInputProps } from './types';

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

const INPUT_KIND_RULES: ReadonlyArray<{
  kind: FieldInputKind;
  matches: (field: ConfigField, hasSetValue: boolean) => boolean;
}> = [
  {
    kind: 'fileUpload',
    matches: (f, hasSetValue) => f.ui?.component === 'fileUpload' && !!f.ui.fileMapping && hasSetValue,
  },
  {
    kind: 'secure',
    matches: (f) => f.target === 'secureJsonData',
  },
  {
    kind: 'radio',
    matches: (f) => f.ui?.component === 'radio',
  },
  {
    kind: 'select',
    matches: (f) => f.ui?.component === 'select',
  },
  {
    kind: 'boolean',
    matches: (f) => f.valueType === 'boolean',
  },
  {
    kind: 'number',
    matches: (f) => f.valueType === 'number',
  },
  {
    kind: 'textarea',
    matches: (f) => f.ui?.component === 'textarea',
  },
  {
    kind: 'indexedPair',
    matches: (f) => f.storage?.type === 'indexedPair',
  },
  {
    kind: 'stringArray',
    matches: (f) => f.valueType === 'array' && f.item?.valueType === 'string',
  },
  {
    kind: 'objectArray',
    matches: (f) => f.valueType === 'array' && f.item?.valueType === 'object' && !!f.item.fields?.length,
  },
  {
    kind: 'complex',
    matches: (f) =>
      f.valueType === 'object' ||
      f.valueType === 'map' ||
      (f.valueType === 'array' && (f.item?.valueType === 'object' || f.item?.valueType === 'map')),
  },
  {
    kind: 'text',
    matches: () => true,
  },
];

export function resolveFieldInputKind(field: ConfigField, hasSetValue: boolean): FieldInputKind {
  return INPUT_KIND_RULES.find((rule) => rule.matches(field, hasSetValue))!.kind;
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
