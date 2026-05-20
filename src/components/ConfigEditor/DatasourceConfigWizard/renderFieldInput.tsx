import React from 'react';
import { Input, Select, RadioButtonGroup, Switch, TextArea } from '@grafana/ui';
import { SecureFieldInput, type FormFieldRef } from './inputs/SecureFieldInput';
import { StringArrayInput, IndexedPairEditor, FileUploadField, ObjectArrayEditor, ComplexFieldNote } from './inputs';
import type { ConfigField } from '../../../datasource/schema/schema';
import type { IndexedPairItem } from '../../../datasource/schema/datasource';

export function renderFieldInput(
  field: ConfigField,
  formField: FormFieldRef,
  disabled?: boolean,
  errorMessage?: string,
  setValue?: (name: string, value: unknown) => void
) {
  const value = formField.value;
  const placeholder = field.ui?.placeholder;
  const label = field.label ?? field.key;

  // File upload with JSON parsing and cross-field distribution
  if (field.ui?.component === 'fileUpload' && field.ui.fileMapping && setValue) {
    return <FileUploadField field={field} formField={formField} disabled={disabled} setValue={setValue} />;
  }

  // Secure fields (password/token in secureJsonData)
  if (field.target === 'secureJsonData' || field.semanticType === 'password' || field.semanticType === 'token') {
    return (
      <SecureFieldInput formField={formField} placeholder={placeholder ?? label} disabled={disabled} label={label} />
    );
  }

  // Radio button group — checked before type-specific branches so a field
  // with e.g. valueType:"number" + ui.component:"radio" renders as radio.
  if (field.ui?.component === 'radio') {
    const options = (field.ui?.options ?? []).map((opt) => ({
      label: opt.label,
      value: String(opt.value),
      description: opt.description,
    }));
    return (
      <div style={{ display: 'flex' }}>
        <RadioButtonGroup
          options={options}
          value={String(value ?? '')}
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

  // Select / dropdown fields
  if (field.ui?.component === 'select') {
    const options = (field.ui?.options ?? []).map((opt) => ({
      label: opt.label,
      value: String(opt.value),
      description: opt.description,
    }));
    return (
      <Select
        options={options}
        value={options.find((o) => o.value === String(value ?? ''))}
        onChange={(v) => formField.onChange(v?.value)}
        disabled={disabled}
      />
    );
  }

  // Boolean fields
  if (field.valueType === 'boolean') {
    return <Switch value={!!value} onChange={(e) => formField.onChange(e.currentTarget.checked)} disabled={disabled} />;
  }

  // Number fields
  if (field.valueType === 'number') {
    return (
      <Input
        {...formField}
        value={value !== undefined && value !== null ? Number(value) : ''}
        type="number"
        placeholder={placeholder}
        disabled={disabled}
        onChange={(e) => {
          const n = e.currentTarget.valueAsNumber;
          formField.onChange(Number.isNaN(n) ? undefined : n);
        }}
      />
    );
  }

  // URL fields
  if (field.semanticType === 'url') {
    return (
      <Input {...formField} value={String(value ?? '')} type="url" placeholder={placeholder} disabled={disabled} />
    );
  }

  // Textarea
  if (field.ui?.component === 'textarea') {
    return (
      <TextArea
        {...formField}
        value={String(value ?? '')}
        placeholder={placeholder}
        disabled={disabled}
        rows={field.ui?.rows ?? 3}
      />
    );
  }

  // Indexed pair fields (e.g. custom HTTP headers, endpoint params) — editable key-value list.
  // Checked before the generic string-array branch because indexedPair fields
  // also declare valueType:"array" + item.valueType:"string".
  if (field.storage?.type === 'indexedPair') {
    const items = Array.isArray(value) ? (value as IndexedPairItem[]) : [];
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

  // Array of strings — row-based list editor
  if (field.valueType === 'array' && field.item?.valueType === 'string') {
    return (
      <StringArrayInput
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={formField.onChange}
        placeholder={placeholder}
        disabled={disabled}
        itemLabel={label.toLowerCase().replace(/s$/, '')}
      />
    );
  }

  // Array of objects with defined item fields — inline editor
  if (field.valueType === 'array' && field.item?.valueType === 'object' && field.item.fields?.length) {
    return (
      <ObjectArrayEditor
        field={field}
        value={value}
        onChange={formField.onChange}
        disabled={disabled}
        errorMessage={errorMessage}
      />
    );
  }

  // Complex fields (unconstrained object arrays, maps, plain objects) — not editable in the wizard
  if (
    field.valueType === 'object' ||
    field.valueType === 'map' ||
    (field.valueType === 'array' && (field.item?.valueType === 'object' || field.item?.valueType === 'map'))
  ) {
    const count = Array.isArray(value) ? value.length : 0;
    return <ComplexFieldNote count={count} label={label} />;
  }

  // Default: text input
  return <Input {...formField} value={String(value ?? '')} placeholder={placeholder} disabled={disabled} />;
}
