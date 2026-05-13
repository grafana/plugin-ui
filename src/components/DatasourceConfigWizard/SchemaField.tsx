import React from 'react';
import { type useForm, Controller } from 'react-hook-form';
import { useStyles2, Icon, Tooltip } from '@grafana/ui';
import { type ConfigField, resolveActiveOverride, formKey } from '../../datasource/schema/config';
import type { FormValues } from '../../datasource/schema/types';
import { isFieldRequired, buildValidationRules } from './fieldUtils';
import { PdcFieldNote } from './PdcFieldNote';
import { renderFieldInput } from './renderFieldInput';
import { getWizardStyles } from './wizardStyles';

export type SchemaFieldProps = {
  field: ConfigField;
  control: ReturnType<typeof useForm<FormValues>>['control'];
  errors: ReturnType<typeof useForm<FormValues>>['formState']['errors'];
  disabled?: boolean;
  dsUid: string;
  watchedValues: Record<string, unknown>;
  fieldById: Map<string, ConfigField>;
};

export function SchemaField({ field, control, errors, disabled, dsUid, watchedValues, fieldById }: SchemaFieldProps) {
  const styles = useStyles2(getWizardStyles);

  const activeOverride = resolveActiveOverride(field, watchedValues, fieldById);
  const fk = formKey(field);

  if (field.key === 'pdcInjected' && field.target === 'jsonData') {
    return (
      <Controller
        name={fk}
        control={control}
        render={({ field: formField }) => (
          <PdcFieldNote
            enabled={!!formField.value}
            description={field.description}
            configUrl={`/connections/datasources/edit/${dsUid}`}
          />
        )}
      />
    );
  }

  const required = isFieldRequired(field, watchedValues, fieldById);
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
              {renderFieldInput(effectiveField, formField, disabled || isReadOnly)}
              {errorMessage && <span className={styles.fieldError}>{errorMessage}</span>}
            </div>
          </div>
        );
      }}
    />
  );
}
