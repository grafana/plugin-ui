import React, { type ReactNode } from 'react';
import { WizardLayout } from './WizardLayout';
import { useDatasourceConfigForm } from './hooks/useDatasourceConfigForm';
import type { DatasourceConfigSchema } from '../../../schema/schema';

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
  const form = useDatasourceConfigForm({ schema, dsUid, onSuccess, onSaving });
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
