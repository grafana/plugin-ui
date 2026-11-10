import React, { useState } from 'react';

import { scanCode, scanText, type SecretFinding } from '../core/index';
import { SecretFindingsPanel } from './SecretScannerPanel';

export default {
  title: 'Secret scanner/SecretFindingsPanel',
  component: SecretFindingsPanel,
};

// Fake credentials, shaped to trip the detectors. None of these are real.
const SCRIPT = [
  `import http from 'k6/http'`,
  ``,
  `const token = 'ghp_1234567890abcdefghijklmnopqrstuvwxyz'`,
  `const password = 'hunter2xyz'`,
  ``,
  `export default function () {`,
  `  http.get('https://example.test/pay?key=glsa_QrneKTYtSZt3qDXqDrzbDLMTmAKlpQpM_55d72f20')`,
  `}`,
].join('\n');

const PROSE = 'Log in with API key AKIAIOSFODNN7EXAMPLE, then paste sk_live_1234567890abcdefABCD in the form.';

export const CodeFindings = () => (
  <SecretFindingsPanel findings={scanCode(SCRIPT)} onMove={() => {}} onIgnore={() => {}} />
);

export const TextFindings = () => (
  <SecretFindingsPanel
    findings={scanText(PROSE)}
    onIgnore={() => {}}
    showLine={false}
    description="This prompt is stored in plaintext. Move any credentials to Secrets Manager."
  />
);

export const ReadOnly = () => <SecretFindingsPanel findings={scanCode(SCRIPT)} />;

export const Empty = () => <SecretFindingsPanel findings={[]} />;

export const Interactive = () => {
  const [ignored, setIgnored] = useState<string[]>([]);
  const findings = scanCode(SCRIPT).filter((finding) => !ignored.includes(finding.id));

  return (
    <SecretFindingsPanel
      findings={findings}
      onMove={(finding: SecretFinding) => window.alert(`Move ${finding.label} to a secret`)}
      onIgnore={(finding: SecretFinding) => setIgnored((current) => [...current, finding.id])}
    />
  );
};
