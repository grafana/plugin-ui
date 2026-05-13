import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ConfigField, ConfigGroup, DatasourceConfigSchema } from '../../../datasource/schema/schema';
import {
  resolveGroups,
  resolveRequiredFieldsGroup,
  parseDependsOn,
  computeVirtualFieldValues,
  formKey,
} from '../../../datasource/schema/config';
import {
  SECURE_FIELD_CONFIGURED,
  fetchExistingValues,
  submitDatasourceConfig,
} from '../../../datasource/schema/datasource';
import type { FormValues } from '../../../datasource/schema/types';
import { evaluateEffectCondition, isFieldRequired } from './fieldUtils';

export type DatasourceConfigFormOptions = {
  schema: DatasourceConfigSchema;
  dsUid: string;
  onSuccess: (status: string, message?: string) => void;
  onSaving?: (saving: boolean) => void;
};

export type ResolvedGroup = { group: ConfigGroup; fields: ConfigField[] };

export function useDatasourceConfigForm({ schema, dsUid, onSuccess, onSaving }: DatasourceConfigFormOptions) {
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [detectedReadOnly, setDetectedReadOnly] = useState(false);
  const readOnly = detectedReadOnly;

  const resolvedGroups: ResolvedGroup[] = useMemo(() => {
    const groups = resolveGroups(schema);
    const requiredGroup = resolveRequiredFieldsGroup(schema);
    if (!requiredGroup) {
      return groups;
    }
    return [requiredGroup, ...groups];
  }, [schema]);

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

  /** Check if a group has any visible required fields that are empty. */
  const isGroupValid = useCallback(
    (group: ResolvedGroup): boolean => {
      for (const field of group.fields) {
        if (!isFieldVisible(field)) {
          continue;
        }
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
    },
    [errors, watchedValues, fieldById, isFieldVisible]
  );

  /** Check if a group has any fields with non-default/non-empty values. */
  const groupHasData = useCallback(
    (group: ResolvedGroup): boolean => {
      for (const field of group.fields) {
        const val = watchedValues[formKey(field)];
        if (val === undefined || val === null || val === '' || val === false) {
          continue;
        }
        if (val === field.defaultValue) {
          continue;
        }
        return true;
      }
      return false;
    },
    [watchedValues]
  );

  return {
    // Schema
    resolvedGroups,
    fieldById,
    httpHeadersField,
    // Form
    control,
    handleSubmit,
    trigger,
    errors,
    watchedValues,
    // State
    initializing,
    fetchError,
    submitting,
    submitError,
    readOnly,
    // Callbacks
    isFieldVisible,
    isGroupValid,
    groupHasData,
    onSubmit,
  };
}
