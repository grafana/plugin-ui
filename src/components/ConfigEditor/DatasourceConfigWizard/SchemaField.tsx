import React from 'react';
import { type useForm, Controller } from 'react-hook-form';
import { useStyles2, Icon, Tooltip } from '@grafana/ui';
import { resolveActiveOverride, formKey } from './config';
import { isFieldRequired, buildValidationRules, parseItemErrors } from './fieldUtils';
import { FieldInput } from './FieldInput';
import { getFieldStyles } from './styles';
import type { FormValues } from './datasource';
import type { ConfigField } from '../../../schema/schema';

export type SchemaFieldProps = {
  field: ConfigField;
  control: ReturnType<typeof useForm<FormValues>>['control'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  disabled?: boolean;
  dsUid: string;
  watchedValues: Record<string, unknown>;
  fieldById: Map<string, ConfigField>;
  celContext?: Record<string, unknown>;
  setValue?: (name: string, value: unknown) => void;
};

export function SchemaField({
  field,
  control,
  errors,
  disabled,
  watchedValues,
  fieldById,
  celContext,
  setValue,
}: SchemaFieldProps) {
  const styles = useStyles2(getFieldStyles);

  const activeOverride = resolveActiveOverride(field, watchedValues, fieldById);
  const fk = formKey(field);

  const required = isFieldRequired(field, watchedValues, fieldById, celContext);
  const validationRules = buildValidationRules(field, required);

  return (
    <Controller
      name={fk}
      control={control}
      rules={validationRules}
      render={({ field: formField }) => {
        const errorMessage = errors[fk]?.message as string | undefined;
        const label = field.label ?? field.key;
        const description = activeOverride?.description ?? field.description;
        const effectiveField = activeOverride
          ? {
              ...field,
              description,
              ui: {
                ...field.ui,
                placeholder: activeOverride.placeholder ?? field.ui?.placeholder,
              } as ConfigField['ui'],
            }
          : field;
        const isReadOnly = !!activeOverride?.readOnly;
        const isBool = field.valueType === 'boolean';

        return (
          <div className={isBool ? styles.fieldRowCenter : styles.fieldRow}>
            <div className={isBool ? styles.fieldLabelRowCompact : styles.fieldLabelRow}>
              <span className={styles.fieldLabel}>
                {label}
                {required && <span className={styles.fieldRequired}>*</span>}
              </span>
              {description && (
                <Tooltip content={description}>
                  <Icon name="info-circle" size="xs" className={styles.fieldInfoIcon} />
                </Tooltip>
              )}
            </div>
            <div className={styles.fieldInputCol}>
              <FieldInput
                field={effectiveField}
                formField={formField}
                disabled={disabled || isReadOnly}
                errorMessage={errorMessage}
                setValue={setValue}
              />
              {/* Show global error only if it's NOT a per-item error (those render inline) */}
              {errorMessage && !parseItemErrors(errorMessage) && (
                <span className={styles.fieldError}>{errorMessage}</span>
              )}
            </div>
          </div>
        );
      }}
    />
  );
}
