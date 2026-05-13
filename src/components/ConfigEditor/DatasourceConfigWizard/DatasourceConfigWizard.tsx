import React, { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useStyles2, Button, LinkButton, Select, Icon, Alert, Tooltip, Spinner } from '@grafana/ui';
import {
  resolveGroups,
  resolveRequiredFieldsGroup,
  parseDependsOn,
  computeVirtualFieldValues,
  formKey,
  type ConfigField,
  type DatasourceConfigSchema,
} from '../../../datasource/schema/config';
import {
  SECURE_FIELD_CONFIGURED,
  fetchExistingValues,
  submitDatasourceConfig,
} from '../../../datasource/schema/datasource';
import type { FormValues } from '../../../datasource/schema/types';
import { evaluateEffectCondition, isFieldRequired } from './fieldUtils';
import { SchemaField } from './SchemaField';
import { AuthorizationHeaderField } from './AuthorizationHeaderField';
import { getWizardStyles } from './wizardStyles';

export type DatasourceConfigWizardProps = {
  schema: DatasourceConfigSchema;
  dsUid: string;
  dsName: string;
  onSuccess: (status: string, message?: string) => void;
  onSaving?: (saving: boolean) => void;
  onRetest?: () => void;
  onFollowup?: (intent: string) => void;
  healthError?: string;
  /** Optional render prop for custom action buttons (e.g. analyze/troubleshoot). */
  renderActions?: (props: { dsUid: string; dsName: string; dsType: string; healthError?: string }) => ReactNode;
};

export function DatasourceConfigWizard(props: DatasourceConfigWizardProps) {
  const { schema, dsUid, dsName, onSuccess, onSaving, onRetest, healthError, renderActions } = props;
  const styles = useStyles2(getWizardStyles);
  const [currentStep, setCurrentStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detectedReadOnly, setDetectedReadOnly] = useState(false);
  const readOnly = detectedReadOnly;

  const resolvedGroups = useMemo(() => {
    const groups = resolveGroups(schema);
    const requiredGroup = resolveRequiredFieldsGroup(schema);
    if (!requiredGroup) {
      return groups;
    }
    return [requiredGroup, ...groups];
  }, [schema]);

  const arrowSteps = useMemo(() => {
    const requiredGroup = resolvedGroups.find((g) => g.group.id === '_required');
    if (!requiredGroup) {
      return new Set(resolvedGroups.map((_, i) => i));
    }
    const requiredFieldIds = new Set(requiredGroup.fields.map((f) => f.id));
    const steps = new Set<number>();
    for (let i = 0; i < resolvedGroups.length; i++) {
      const g = resolvedGroups[i];
      if (g.group.id === '_required' || g.fields.some((f) => !requiredFieldIds.has(f.id))) {
        steps.add(i);
      }
    }
    return steps;
  }, [resolvedGroups]);

  const fieldById = useMemo(() => {
    const m = new Map<string, ConfigField>();
    for (const f of schema.fields) {
      m.set(f.id, f);
    }
    return m;
  }, [schema.fields]);

  const httpHeadersField = useMemo(
    () => schema.fields.find((f) => f.key === 'httpHeaders' && f.storage?.type === 'indexedPair') ?? null,
    [schema.fields]
  );

  const allStorageFields = useMemo(
    () => schema.fields.filter((f) => f.kind !== 'virtual' && !f.isItemField && f.target),
    [schema.fields]
  );

  const {
    control,
    handleSubmit,
    watch,
    reset,
    trigger,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onChange' });

  const fieldsWithEffects = useMemo(() => {
    const result: Array<{
      sourceKey: string;
      effects: Array<{ when: string; targets: Array<{ key: string; value: unknown }> }>;
    }> = [];
    for (const field of schema.fields) {
      if (!field.effects || field.effects.length === 0) {
        continue;
      }
      const mapped = field.effects.map((eff) => ({
        when: eff.when,
        targets: Object.entries(eff.set).map(([targetId, val]) => {
          const targetField = fieldById.get(targetId);
          return { key: targetField ? formKey(targetField) : targetId, value: val };
        }),
      }));
      result.push({ sourceKey: formKey(field), effects: mapped });
    }
    return result;
  }, [schema.fields, fieldById]);

  // Load existing values on mount
  useEffect(() => {
    let cancelled = false;
    fetchExistingValues(dsUid, allStorageFields).then((result) => {
      if (cancelled) {
        return;
      }
      if (result.error) {
        setFetchError(result.error);
        setInitializing(false);
        return;
      }
      if (result.readOnly) {
        setDetectedReadOnly(true);
      }
      const defaults: FormValues = {};
      for (const field of allStorageFields) {
        if (field.defaultValue !== undefined) {
          defaults[formKey(field)] = field.defaultValue;
        }
      }
      const merged = { ...defaults, ...result.values };
      const virtualValues = computeVirtualFieldValues(schema, merged);
      reset({ ...merged, ...virtualValues });
      setInitializing(false);
    });
    return () => {
      cancelled = true;
    };
  }, [dsUid, allStorageFields, schema, reset]);

  const watchedValues = watch();

  // Apply field effects
  const prevEffectValuesRef = useRef<Record<string, unknown>>({});
  useEffect(() => {
    if (initializing) {
      return;
    }
    for (const { sourceKey, effects } of fieldsWithEffects) {
      const currentVal = watchedValues[sourceKey];
      const prevVal = prevEffectValuesRef.current[sourceKey];
      if (currentVal === prevVal) {
        continue;
      }
      prevEffectValuesRef.current[sourceKey] = currentVal;
      for (const eff of effects) {
        if (evaluateEffectCondition(eff.when, currentVal)) {
          for (const { key, value } of eff.targets) {
            setValue(key, value);
          }
          break;
        }
      }
    }
  }, [watchedValues, fieldsWithEffects, initializing, setValue]);

  // Override defaults
  const fieldsWithOverrideDefaults = useMemo(() => {
    const result: Array<{
      targetKey: string;
      fieldDefault: unknown;
      overrides: Array<{ depKey: string; depValue: string; defaultValue: unknown }>;
    }> = [];
    for (const field of schema.fields) {
      if (!field.overrides || field.overrides.length === 0) {
        continue;
      }
      const ovs = field.overrides
        .filter((ov) => ov.defaultValue !== undefined)
        .map((ov) => {
          const parsed = parseDependsOn(ov.when);
          if (!parsed) {
            return null;
          }
          const depField = fieldById.get(parsed.field);
          return {
            depKey: depField ? formKey(depField) : parsed.field,
            depValue: parsed.value,
            defaultValue: ov.defaultValue,
          };
        })
        .filter(Boolean) as Array<{ depKey: string; depValue: string; defaultValue: unknown }>;
      if (ovs.length > 0) {
        result.push({ targetKey: formKey(field), fieldDefault: field.defaultValue, overrides: ovs });
      }
    }
    return result;
  }, [schema.fields, fieldById]);

  const prevOverrideDepRef = useRef<Record<string, string>>({});
  useEffect(() => {
    if (initializing) {
      return;
    }
    for (const { targetKey, fieldDefault, overrides } of fieldsWithOverrideDefaults) {
      for (const ov of overrides) {
        const currentDepVal = String(watchedValues[ov.depKey] ?? '');
        const trackKey = `${targetKey}::${ov.depKey}`;
        const prevDepVal = prevOverrideDepRef.current[trackKey];
        if (currentDepVal === prevDepVal) {
          continue;
        }
        prevOverrideDepRef.current[trackKey] = currentDepVal;
        if (currentDepVal === ov.depValue) {
          setValue(targetKey, ov.defaultValue);
        } else if (prevDepVal === ov.depValue && fieldDefault !== undefined) {
          setValue(targetKey, fieldDefault);
        }
      }
    }
  }, [watchedValues, fieldsWithOverrideDefaults, initializing, setValue]);

  const isFieldVisible = useCallback(
    (field: ConfigField): boolean => {
      if (field.kind === 'virtual' && !field.ui) {
        return false;
      }
      if (field.tags?.some((t) => t.startsWith('managed-by:'))) {
        return false;
      }
      if (!field.dependsOn) {
        return true;
      }
      const parsed = parseDependsOn(field.dependsOn);
      if (!parsed) {
        return true;
      }
      const depField = fieldById.get(parsed.field);
      const depKey = depField ? formKey(depField) : parsed.field;
      return String(watchedValues[depKey] ?? '') === parsed.value;
    },
    [watchedValues, fieldById]
  );

  const currentResolved = resolvedGroups[currentStep];

  const isFirstStep = useMemo(() => {
    for (let i = 0; i < currentStep; i++) {
      if (arrowSteps.has(i)) {
        return false;
      }
    }
    return true;
  }, [currentStep, arrowSteps]);

  const isLastStep = useMemo(() => {
    for (let i = currentStep + 1; i < resolvedGroups.length; i++) {
      if (arrowSteps.has(i)) {
        return false;
      }
    }
    return true;
  }, [currentStep, arrowSteps, resolvedGroups.length]);

  const visibleFieldsForStep = useMemo(
    () => (currentResolved ? currentResolved.fields.filter(isFieldVisible) : []),
    [currentResolved, isFieldVisible]
  );

  const currentGroupValid = useMemo(() => {
    if (!currentResolved) {
      return true;
    }
    for (const field of visibleFieldsForStep) {
      if (errors[formKey(field)]) {
        return false;
      }
      if (isFieldRequired(field, watchedValues, fieldById)) {
        const val = watchedValues[formKey(field)];
        if (val === SECURE_FIELD_CONFIGURED) {
          continue;
        }
        if (val === undefined || val === null || val === '') {
          return false;
        }
      }
    }
    return true;
  }, [currentResolved, errors, visibleFieldsForStep, watchedValues, fieldById]);

  const goNext = useCallback(async () => {
    if (!currentResolved) {
      return;
    }
    if (!readOnly) {
      const visibleKeys = visibleFieldsForStep.map((f) => formKey(f));
      const valid = await trigger(visibleKeys);
      if (!valid) {
        return;
      }
    }
    setCurrentStep((s) => {
      for (let i = s + 1; i < resolvedGroups.length; i++) {
        if (arrowSteps.has(i)) {
          return i;
        }
      }
      return s;
    });
  }, [currentResolved, visibleFieldsForStep, trigger, resolvedGroups.length, arrowSteps, readOnly]);

  const goPrev = useCallback(() => {
    setCurrentStep((s) => {
      for (let i = s - 1; i >= 0; i--) {
        if (arrowSteps.has(i)) {
          return i;
        }
      }
      return s;
    });
  }, [arrowSteps]);

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setSubmitting(true);
      setSubmitError(null);
      onSaving?.(true);
      const minDelay = new Promise((r) => setTimeout(r, 2000));

      try {
        await submitDatasourceConfig(dsUid, data, allStorageFields, isFieldVisible);
        const [refreshed] = await Promise.all([fetchExistingValues(dsUid, allStorageFields), minDelay]);
        const defaults: FormValues = {};
        for (const field of allStorageFields) {
          if (field.defaultValue !== undefined) {
            defaults[formKey(field)] = field.defaultValue;
          }
        }
        const merged = { ...defaults, ...refreshed.values };
        const virtualValues = computeVirtualFieldValues(schema, merged);
        reset({ ...merged, ...virtualValues });
        onSuccess('UPDATED', 'Configuration saved.');
      } catch (err: unknown) {
        await minDelay;
        setSubmitError(err instanceof Error ? err.message : 'Failed to update datasource');
      } finally {
        setSubmitting(false);
        onSaving?.(false);
      }
    },
    [dsUid, allStorageFields, isFieldVisible, schema, reset, onSuccess, onSaving]
  );

  if (initializing) {
    return (
      <div className={styles.container}>
        <Spinner size="sm" inline /> Loading configuration...
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className={styles.container}>
        <Alert severity="error" title="Failed to load configuration">
          {fetchError}
        </Alert>
        <div className={styles.buttons}>
          <LinkButton
            variant="secondary"
            size="sm"
            icon="external-link-alt"
            href={`/connections/datasources/edit/${dsUid}`}
          >
            Open datasource settings
          </LinkButton>
        </div>
      </div>
    );
  }

  const allDisabled = submitting || readOnly;

  if (resolvedGroups.length === 0) {
    return null;
  }

  const currentGroup = currentResolved?.group;

  return (
    <div className={styles.container}>
      {submitting && (
        <div className={styles.overlay}>
          <Spinner size="sm" />
          <span>Saving & testing…</span>
        </div>
      )}
      {readOnly && (
        <div className={styles.readOnlyBanner}>
          <Icon name="lock" size="xs" />
          <span>Read-only — managed externally</span>
        </div>
      )}
      <div className={styles.navBar}>
        {currentGroup && (
          <Tooltip content={currentGroup.description ?? currentGroup.title}>
            <span className={styles.navTitle}>
              {currentGroup.title}
              <span className={styles.stepCount}>
                {currentStep + 1}/{resolvedGroups.length}
              </span>
            </span>
          </Tooltip>
        )}
        <div className={styles.navActions}>
          <Tooltip content={isFirstStep ? 'First step' : `Previous: ${resolvedGroups[currentStep - 1]?.group.title}`}>
            <Button
              variant="secondary"
              fill="text"
              size="sm"
              icon="angle-left"
              aria-label="Previous"
              onClick={goPrev}
              disabled={isFirstStep || submitting}
              type="button"
            />
          </Tooltip>
          <Select
            options={resolvedGroups.map((g, i) => ({ label: g.group.title, value: i }))}
            value={currentStep}
            onChange={(v) => {
              if (v) {
                setCurrentStep(v.value!);
              }
            }}
            disabled={submitting}
            width={18}
          />
          <Tooltip content={isLastStep ? 'Last step' : `Next: ${resolvedGroups[currentStep + 1]?.group.title}`}>
            <Button
              variant={isLastStep || (!readOnly && !currentGroupValid) ? 'secondary' : 'primary'}
              size="sm"
              icon="angle-right"
              aria-label="Next"
              onClick={goNext}
              disabled={isLastStep || submitting}
              type="button"
            />
          </Tooltip>
        </div>
      </div>

      {currentResolved && (
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {visibleFieldsForStep.map((field) => (
            <SchemaField
              key={formKey(field)}
              field={field}
              control={control}
              errors={errors}
              disabled={allDisabled}
              dsUid={dsUid}
              watchedValues={watchedValues}
              fieldById={fieldById}
            />
          ))}

          {(currentResolved.group.id === '_required' || currentResolved.group.id === 'auth') && httpHeadersField && (
            <AuthorizationHeaderField
              headersFieldKey={formKey(httpHeadersField)}
              control={control}
              disabled={allDisabled}
              watchedValues={watchedValues}
            />
          )}

          {submitError && (
            <Alert severity="error" title="Error">
              {submitError}
            </Alert>
          )}

          <div className={styles.buttons}>
            {readOnly ? (
              <Button variant="primary" size="sm" icon="sync" onClick={onRetest} type="button">
                Test
              </Button>
            ) : (
              <Button variant="primary" size="sm" disabled={submitting || !currentGroupValid} type="submit">
                {submitting ? 'Saving...' : 'Save & Test'}
              </Button>
            )}
            {healthError && renderActions?.({ dsUid, dsName, dsType: schema.pluginType, healthError })}
          </div>
        </form>
      )}
    </div>
  );
}
