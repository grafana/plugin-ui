import React from 'react';
import { Input, Select, RadioButtonGroup, Switch, TextArea } from '@grafana/ui';
import type { ConfigField } from '../../datasource/schema/config';
import type { IndexedPairItem } from '../../datasource/schema/datasource';
import { SecureFieldInput, type FormFieldRef } from './SecureFieldInput';
import { StringArrayInput } from './StringArrayInput';
import { IndexedPairEditor } from './IndexedPairEditor';
import { ComplexFieldNote } from './ComplexFieldNote';

export function renderFieldInput(field: ConfigField, formField: FormFieldRef, disabled?: boolean) {
  const value = formField.value;
  const placeholder = field.ui?.placeholder;
  const label = field.label ?? field.key;

  // Secure fields (password/token in secureJsonData)
  if (field.target === 'secureJsonData' || field.semanticType === 'password' || field.semanticType === 'token') {
    return (
      <SecureFieldInput formField={formField} placeholder={placeholder ?? label} disabled={disabled} label={label} />
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

  // Radio button group
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
          onChange={(v) => formField.onChange(v)}
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

  // Array of strings — tag/chip input
  if (field.valueType === 'array' && field.item?.valueType === 'string') {
    return (
      <StringArrayInput
        value={Array.isArray(value) ? (value as string[]) : []}
        onChange={formField.onChange}
        placeholder={placeholder ?? `Add ${label.toLowerCase()}…`}
        disabled={disabled}
      />
    );
  }

  // Indexed pair fields (e.g. custom HTTP headers) — editable key-value list
  if (field.storage?.type === 'indexedPair') {
    const items = Array.isArray(value) ? (value as IndexedPairItem[]) : [];
    const maxItems =
      field.validations?.find((v): v is { type: 'itemCount'; max?: number } => v.type === 'itemCount')?.max ?? 10;
    return <IndexedPairEditor value={items} onChange={formField.onChange} maxItems={maxItems} disabled={disabled} />;
  }

  // Complex fields (array of objects/maps, object, map) — not editable in the wizard
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
