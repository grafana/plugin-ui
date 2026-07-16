import React, { type ReactNode, useMemo, useState } from 'react';
import { useStyles2, Button, Select, Icon, Tooltip, Spinner } from '@grafana/ui';
import { isAuthGroupId } from './config';
import { GroupFields, FormFooter, FetchErrorState } from './layoutParts';
import { getWizardStyles } from './styles';
import { type DatasourceConfigSchema } from '../../../schema/schema';
import { type useDatasourceConfigForm } from './hooks/useDatasourceConfigForm';

type WizardLayoutProps = {
  form: ReturnType<typeof useDatasourceConfigForm>;
  schema: DatasourceConfigSchema;
  dsUid: string;
  dsName: string;
  onRetest?: () => void;
  healthError?: string;
  renderActions?: (props: { dsUid: string; dsName: string; dsType: string; healthError?: string }) => ReactNode;
};

export function WizardLayout({ form, schema, dsUid, dsName, onRetest, healthError, renderActions }: WizardLayoutProps) {
  const styles = useStyles2(getWizardStyles);
  const [currentStep, setCurrentStep] = useState(0);
  const { resolvedGroups, handleSubmit, initializing, fetchError, submitting, readOnly, isGroupValid, onSubmit } = form;
  const canSave = useMemo(() => resolvedGroups.every(isGroupValid), [resolvedGroups, isGroupValid]);

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
    return <></>;
  }

  const currentResolved = resolvedGroups[currentStep];
  const currentGroup = currentResolved?.group;
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === resolvedGroups.length - 1;

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
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={isFirstStep || submitting}
              type="button"
            />
          </Tooltip>
          <Select
            options={resolvedGroups.map((g, i) => ({ label: g.group.title, value: i }))}
            value={currentStep}
            onChange={(v) => {
              if (v?.value != null) {
                setCurrentStep(v.value);
              }
            }}
            disabled={submitting}
            width={18}
          />
          <Tooltip content={isLastStep ? 'Last step' : `Next: ${resolvedGroups[currentStep + 1]?.group.title}`}>
            <Button
              variant={isLastStep ? 'secondary' : 'primary'}
              size="sm"
              icon="angle-right"
              aria-label="Next"
              onClick={() => setCurrentStep(currentStep + 1)}
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
            saveDisabled={submitting || !canSave}
            className={styles.buttons}
          />
        </form>
      )}
    </div>
  );
}
