import React, { useState } from 'react';
import { RadioButtonGroup } from '@grafana/ui';
import { DatasourceConfigWizard, type DatasourceConfigWizardProps } from '../DatasourceConfigWizard';

const modeOptions = [
  { label: 'Tab', value: 'tab' as const },
  { label: 'Wizard', value: 'wizard' as const },
];

type StoryModeWrapperProps = Omit<DatasourceConfigWizardProps, 'mode'>;

export function StoryModeWrapper(props: StoryModeWrapperProps) {
  const [mode, setMode] = useState<'tab' | 'wizard'>('tab');

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>Mode:</span>
        <RadioButtonGroup options={modeOptions} value={mode} onChange={(v) => setMode(v)} />
      </div>
      <DatasourceConfigWizard key={mode} {...props} mode={mode} />
    </div>
  );
}
