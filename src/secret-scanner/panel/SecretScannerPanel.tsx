import React from 'react';
import { Alert, Badge, Button, Stack, Text, useStyles2 } from '@grafana/ui';
import type { GrafanaTheme2 } from '@grafana/data';
import { css } from '@emotion/css';

import { maskSecret, type SecretConfidence, type SecretFinding } from '../core/index';
import type { SecretScanner } from '../react/index';

export interface SecretFindingSummary {
  id: string;
  label: string;
  confidence: SecretConfidence;
  secret: string;
  line?: number;
}

interface SecretFindingsPanelProps<T extends SecretFindingSummary> {
  findings: T[];
  onMove?: (finding: T) => void;
  onIgnore?: (finding: T) => void;
  hidden?: boolean;
  showLine?: boolean;
  description?: NonNullable<React.ReactNode>;
  moveLabel?: React.ReactNode;
  ignoreLabel?: React.ReactNode;
}

interface SecretScannerPanelProps extends Omit<
  SecretFindingsPanelProps<SecretFinding>,
  'findings' | 'onMove' | 'onIgnore'
> {
  scanner: SecretScanner;
  readOnly?: boolean;
}

const DEFAULT_DESCRIPTION =
  'Hardcoded secrets in test scripts are stored in plaintext. Move them to Secrets Manager and reference them at runtime instead.';
const DEFAULT_MOVE_LABEL = 'Move to secret';
const DEFAULT_IGNORE_LABEL = 'Ignore';

const CONFIDENCE_BADGE: Record<SecretConfidence, { text: string; color: 'red' | 'orange' | 'blue' }> = {
  high: { text: 'high', color: 'red' },
  medium: { text: 'medium', color: 'orange' },
  low: { text: 'low', color: 'blue' },
};

/**
 * Presentational: takes findings and renders them. Accepts any finding shape
 * carrying the fields in `SecretFindingSummary`, so a host can pass its own.
 * For a panel driven by `useSecretScanner`, use `SecretScannerPanel`.
 */
export function SecretFindingsPanel<T extends SecretFindingSummary>({
  findings,
  onMove,
  onIgnore,
  hidden = false,
  showLine = true,
  description = DEFAULT_DESCRIPTION,
  moveLabel = DEFAULT_MOVE_LABEL,
  ignoreLabel = DEFAULT_IGNORE_LABEL,
}: SecretFindingsPanelProps<T>) {
  const styles = useStyles2(getStyles);

  if (hidden || findings.length === 0) {
    return null;
  }

  const title = findings.length === 1 ? '1 potential secret detected' : `${findings.length} potential secrets detected`;

  return (
    <Alert severity="warning" title={title}>
      <Text variant="bodySmall">{description}</Text>

      <div className={styles.list}>
        {findings.map((finding) => (
          <div key={finding.id} className={styles.row}>
            <Stack alignItems="center" gap={1} wrap="wrap">
              <Badge text={finding.label} color={CONFIDENCE_BADGE[finding.confidence].color} />
              <code className={styles.value}>{maskSecret(finding.secret)}</code>
              <Text variant="bodySmall" color="secondary">
                {showLine && finding.line != null ? `line ${finding.line} · ` : ''}
                {CONFIDENCE_BADGE[finding.confidence].text} confidence
              </Text>
            </Stack>

            <Stack gap={1}>
              {onMove && (
                <Button size="sm" variant="primary" icon="shield" onClick={() => onMove(finding)}>
                  {moveLabel}
                </Button>
              )}
              {onIgnore && (
                <Button size="sm" variant="secondary" fill="outline" onClick={() => onIgnore(finding)}>
                  {ignoreLabel}
                </Button>
              )}
            </Stack>
          </div>
        ))}
      </div>
    </Alert>
  );
}

/**
 * "Move to secret" calls `scanner.migration.request(finding)`, which sets
 * `scanner.migration.finding`; render your own create-secret modal off that, and
 * call `scanner.migration.apply` once the secret exists.
 */
export function SecretScannerPanel({ scanner, readOnly = false, ...rest }: SecretScannerPanelProps) {
  return (
    <SecretFindingsPanel
      findings={scanner.findings}
      onMove={readOnly ? undefined : scanner.migration.request}
      onIgnore={scanner.ignore}
      {...rest}
    />
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    list: css`
      display: flex;
      flex-direction: column;
      gap: ${theme.spacing(1)};
      margin-top: ${theme.spacing(1)};
      /* Cap the list so a script with many findings can't grow the panel
         unbounded and push the editor out of view; scroll past ~8 rows. */
      max-height: ${theme.spacing(40)};
      overflow-y: auto;
    `,
    row: css`
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: ${theme.spacing(2)};
      padding: ${theme.spacing(1)};
      border: 1px solid ${theme.colors.border.weak};
      border-radius: ${theme.shape.radius.default};
      background: ${theme.colors.background.secondary};
      flex-wrap: wrap;
    `,
    value: css`
      font-family: ${theme.typography.fontFamilyMonospace};
      font-size: ${theme.typography.bodySmall.fontSize};
    `,
  };
}
