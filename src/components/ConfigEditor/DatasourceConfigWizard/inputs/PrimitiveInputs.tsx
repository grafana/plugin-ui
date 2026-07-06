import React from 'react';
import { Input, Select, RadioButtonGroup, Switch, TextArea } from '@grafana/ui';
import type { FieldInputProps } from './types';

/** Plain text input — the default when no other kind matches. */
export function TextInput({ field, formField, disabled }: FieldInputProps) {
  return (
    <Input
      {...formField}
      value={String(formField.value ?? '')}
      placeholder={field.ui?.placeholder}
      disabled={disabled}
    />
  );
}

/** Numeric input that preserves `undefined` for empty/NaN values. */
export function NumberInput({ field, formField, disabled }: FieldInputProps) {
  const value = formField.value;
  return (
    <Input
      {...formField}
      value={value !== undefined && value !== null ? Number(value) : ''}
      type="number"
      placeholder={field.ui?.placeholder}
      disabled={disabled}
      onChange={(e) => {
        const n = e.currentTarget.valueAsNumber;
        formField.onChange(Number.isNaN(n) ? undefined : n);
      }}
    />
  );
}

/** Boolean toggle. */
export function BooleanInput({ formField, disabled }: FieldInputProps) {
  return (
    <Switch
      value={!!formField.value}
      onChange={(e) => formField.onChange(e.currentTarget.checked)}
      disabled={disabled}
    />
  );
}

/** Multi-line text input. */
export function TextAreaInput({ field, formField, disabled }: FieldInputProps) {
  return (
    <TextArea
      {...formField}
      value={String(formField.value ?? '')}
      placeholder={field.ui?.placeholder}
      disabled={disabled}
      rows={field.ui?.rows ?? 3}
    />
  );
}

/** Dropdown select. Values are compared as strings to match the option list. */
export function SelectInput({ field, formField, disabled }: FieldInputProps) {
  const options = (field.ui?.options ?? []).map((opt) => ({
    label: opt.label,
    value: String(opt.value),
    description: opt.description,
  }));
  return (
    <Select
      options={options}
      value={options.find((o) => o.value === String(formField.value ?? ''))}
      onChange={(v) => formField.onChange(v?.value)}
      disabled={disabled}
    />
  );
}

/** Radio button group. Preserves the field's native number type on change. */
export function RadioInput({ field, formField, disabled }: FieldInputProps) {
  const options = (field.ui?.options ?? []).map((opt) => ({
    label: opt.label,
    value: String(opt.value),
    description: opt.description,
  }));
  return (
    <div style={{ display: 'flex' }}>
      <RadioButtonGroup
        options={options}
        value={String(formField.value ?? '')}
        onChange={(v) => {
          // Preserve the field's native type when the radio value is selected.
          if (field.valueType === 'number') {
            const n = Number(v);
            formField.onChange(Number.isNaN(n) ? v : n);
          } else {
            formField.onChange(v);
          }
        }}
        disabled={disabled}
      />
    </div>
  );
}
