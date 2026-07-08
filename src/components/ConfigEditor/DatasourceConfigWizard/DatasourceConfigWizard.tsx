import React, { type ReactNode, useCallback, useMemo, useState } from 'react';
import { useStyles2, Button, Select, Icon, Tooltip, Spinner } from '@grafana/ui';
import type { DatasourceConfigSchema } from '../../../schema/schema';
import { formKey, getWatchedValue, isAuthGroupId } from './config';
import { SECURE_FIELD_CONFIGURED } from './datasource';
import { isFieldRequired } from './fieldUtils';
import { GroupFields, FormFooter, FetchErrorState } from './layoutParts';
import { TabLayout } from './TabLayout';
import { getWizardStyles } from './styles';
import { useDatasourceConfigForm } from './hooks/useDatasourceConfigForm';

export type DatasourceConfigWizardProps = {
  schema: DatasourceConfigSchema;
  dsUid: string;
  dsName: string;
  onSuccess: (status: string, message?: string) => void;
  onSaving?: (saving: boolean) => void;
  onRetest?: () => void;
  onFollowup?: (intent: string) => void;
  healthError?: string;
  mode?: 'tab' | 'wizard';
  /** Optional render prop for custom action buttons (e.g. analyze/troubleshoot). */
  renderActions?: (props: { dsUid: string; dsName: string; dsType: string; healthError?: string }) => ReactNode;
};

export function DatasourceConfigWizard(props: DatasourceConfigWizardProps) {
  const { schema, dsUid, dsName, onSuccess, onSaving, onRetest, healthError, renderActions, mode = 'tab' } = props;

  const form = useDatasourceConfigForm({ schema, dsUid, onSuccess, onSaving });

  if (mode === 'tab') {
    return (
      <TabLayout
        form={form}
        schema={schema}
        dsUid={dsUid}
        dsName={dsName}
        onRetest={onRetest}
        healthError={healthError}
        renderActions={renderActions}
      />
    );
  }

  return (
    <WizardLayout
      form={form}
      schema={schema}
      dsUid={dsUid}
      dsName={dsName}
      onRetest={onRetest}
      healthError={healthError}
      renderActions={renderActions}
    />
  );
}

type LayoutProps = {
  form: ReturnType<typeof useDatasourceConfigForm>;
  schema: DatasourceConfigSchema;
  dsUid: string;
  dsName: string;
  onRetest?: () => void;
  healthError?: string;
  renderActions?: (props: { dsUid: string; dsName: string; dsType: string; healthError?: string }) => ReactNode;
};

function WizardLayout({ form, schema, dsUid, dsName, onRetest, healthError, renderActions }: LayoutProps) {
  const styles = useStyles2(getWizardStyles);
  const [currentStep, setCurrentStep] = useState(0);

  const {
    resolvedGroups,
    fieldById,
    handleSubmit,
    trigger,
    errors,
    watchedValues,
    celContext,
    initializing,
    fetchError,
    submitting,
    readOnly,
    isFieldVisible,
    onSubmit,
  } = form;

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
      if (isFieldRequired(field, watchedValues, fieldById, celContext)) {
        const val = getWatchedValue(watchedValues, formKey(field));
        if (val === SECURE_FIELD_CONFIGURED) {
          continue;
        }
        if (val === undefined || val === null || val === '') {
          return false;
        }
      }
    }
    return true;
  }, [currentResolved, errors, visibleFieldsForStep, watchedValues, fieldById, celContext]);

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
        <FetchErrorState error={fetchError} dsUid={dsUid} buttonClassName={styles.buttons} />
      </div>
    );
  }

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
          <GroupFields
            group={currentResolved}
            form={form}
            dsUid={dsUid}
            showAuthHeaders={currentResolved.group.id === '_required' || isAuthGroupId(currentResolved.group.id)}
          />
          <FormFooter
            form={form}
            schema={schema}
            dsUid={dsUid}
            dsName={dsName}
            onRetest={onRetest}
            healthError={healthError}
            renderActions={renderActions}
            saveDisabled={submitting || !currentGroupValid}
            className={styles.buttons}
          />
        </form>
      )}
    </div>
  );
}
