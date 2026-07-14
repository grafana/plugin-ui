import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { ConfigField, DatasourceConfigSchema } from '../../../../schema/schema';
import {
  resolveGroups,
  resolveRequiredFieldsGroup,
  parseDependsOn,
  evaluateDependsOn,
  computeVirtualFieldValues,
  formKey,
  getWatchedValue,
  type ResolvedGroup,
} from '../config';
import { fetchExistingValues, submitDatasourceConfig, type FormValues } from '../datasource';
import { evaluateEffectCondition } from '../inputs/fieldUtils';
import {
  buildFieldCelContext,
  isFieldVisible as isFieldVisibleImpl,
  isFieldDisabled as isFieldDisabledImpl,
  isGroupValid as isGroupValidImpl,
  groupHasData as groupHasDataImpl,
} from './formInterpreter';

export type DatasourceConfigFormOptions = {
  schema: DatasourceConfigSchema;
  dsUid: string;
  onSuccess: (status: string, message?: string) => void;
  onSaving?: (saving: boolean) => void;
};

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
      const currentVal = getWatchedValue(watchedValues, sourceKey);
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
      overrides: Array<{ depKey: string; depValue: string; negate: boolean; defaultValue: unknown }>;
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
            negate: parsed.negate,
            defaultValue: ov.defaultValue,
          };
        })
        .filter(Boolean) as Array<{ depKey: string; depValue: string; negate: boolean; defaultValue: unknown }>;
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
        const currentDepVal = String(getWatchedValue(watchedValues, ov.depKey) ?? '');
        const trackKey = `${targetKey}::${ov.depKey}`;
        const prevDepVal = prevOverrideDepRef.current[trackKey];
        if (currentDepVal === prevDepVal) {
          continue;
        }
        prevOverrideDepRef.current[trackKey] = currentDepVal;
        const active = evaluateDependsOn({ value: ov.depValue, negate: ov.negate }, currentDepVal);
        const wasActive =
          prevDepVal !== undefined && evaluateDependsOn({ value: ov.depValue, negate: ov.negate }, prevDepVal);
        if (active) {
          setValue(targetKey, ov.defaultValue);
        } else if (wasActive && fieldDefault !== undefined) {
          setValue(targetKey, fieldDefault);
        }
      }
    }
  }, [watchedValues, fieldsWithOverrideDefaults, initializing, setValue]);

  // Build a CEL-compatible nested context from flat watched values + field ID mappings.
  const celContext = useMemo(() => buildFieldCelContext(fieldById, watchedValues), [watchedValues, fieldById]);

  const isFieldVisible = useCallback(
    (field: ConfigField): boolean => isFieldVisibleImpl(field, fieldById, celContext),
    [celContext, fieldById]
  );

  const onSubmit = useCallback(
    async (data: FormValues) => {
      setSubmitting(true);
      setSubmitError(null);
      onSaving?.(true);
      // just introduced 2 second delay to add a visual hue. Can be removed if nor required.
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

  const isGroupValid = useCallback(
    (group: ResolvedGroup): boolean =>
      isGroupValidImpl(group, {
        watchedValues,
        fieldById,
        celContext,
        errors: errors as Record<string, unknown>,
        isVisible: isFieldVisible,
      }),
    [errors, watchedValues, fieldById, celContext, isFieldVisible]
  );

  const isFieldDisabled = useCallback(
    (field: ConfigField): boolean => isFieldDisabledImpl(field, celContext),
    [celContext]
  );

  const groupHasData = useCallback(
    (group: ResolvedGroup): boolean => groupHasDataImpl(group, watchedValues),
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
    celContext,
    // State
    initializing,
    fetchError,
    submitting,
    submitError,
    readOnly,
    // Callbacks
    isFieldVisible,
    isFieldDisabled,
    isGroupValid,
    groupHasData,
    onSubmit,
    setValue,
  };
}
