import React, { useState } from 'react';
import { Select } from '@grafana/ui';
import { DatasourceConfigWizard, type DatasourceConfigWizardProps } from '../DatasourceConfigWizard';

const modeOptions = [
  { label: 'Wizard', value: 'wizard' as const },
  { label: 'Tab', value: 'tab' as const },
];

type StoryModeWrapperProps = Omit<DatasourceConfigWizardProps, 'mode'>;

export function StoryModeWrapper(props: StoryModeWrapperProps) {
  const [mode, setMode] = useState<'tab' | 'wizard'>('wizard');

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Mode:</span>
        <Select options={modeOptions} value={mode} onChange={(v) => setMode(v.value!)} width={16} />
      </div>
      <DatasourceConfigWizard key={mode} {...props} mode={mode} />
    </div>
  );
}
