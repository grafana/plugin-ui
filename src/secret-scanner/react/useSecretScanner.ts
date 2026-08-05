import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  createCodeScanner,
  DEFAULT_DEBOUNCE_MS,
  k6SecretRewriter,
  type SecretFinding,
  type SecretRewriter,
} from '../core/index';
import { useIgnoredSecrets } from './useIgnoredSecrets';

export interface UseSecretScannerParams {
  text: string;
  scan?: (text: string) => SecretFinding[];
  rewriter?: SecretRewriter;
  onChange?: (text: string) => void;
  enabled?: boolean;
  ignoreStorageKey?: string;
  debounceMs?: number;
}

export interface SecretReference {
  finding: SecretFinding;
  secretName: string;
  reference: string;
}

export interface SecretMigration {
  finding: SecretFinding | null;
  request: (finding: SecretFinding) => void;
  cancel: () => void;
  apply: (finding: SecretFinding, secretName: string) => void;
}

/** The fallback flow for a secret that couldn't be inserted automatically. */
export interface SecretReferenceFallback {
  pending: SecretReference | null;
  dismiss: () => void;
}

export interface SecretScanner {
  /** Detected secrets, minus the ones the user ignored. */
  findings: SecretFinding[];
  ignore: (finding: SecretFinding) => void;
  migration: SecretMigration;
  reference: SecretReferenceFallback;
}

/**
 * Headless secret scanner over any string — a code editor's contents, a
 * textarea, a prompt field. Owns detection, debouncing, ignore state and the
 * rewrite.
 */
export function useSecretScanner(params: UseSecretScannerParams): SecretScanner {
  const {
    text,
    scan,
    rewriter = k6SecretRewriter,
    onChange,
    enabled = true,
    ignoreStorageKey,
    debounceMs = DEFAULT_DEBOUNCE_MS,
  } = params;

  const defaultScan = useMemo(() => createCodeScanner(), []);
  const scanner = scan ?? defaultScan;

  const { isIgnored, ignore } = useIgnoredSecrets(ignoreStorageKey);
  const [activeFinding, setActiveFinding] = useState<SecretFinding | null>(null);
  const [pendingReference, setPendingReference] = useState<SecretReference | null>(null);
  const [findings, setFindings] = useState<SecretFinding[]>(() => (enabled ? scanner(text) : []));
  useEffect(() => {
    if (!enabled) {
      setFindings([]);
      return;
    }
    const handle = setTimeout(() => setFindings(scanner(text)), debounceMs);
    return () => clearTimeout(handle);
  }, [text, debounceMs, enabled, scanner]);

  const visible = useMemo(() => findings.filter((finding) => !isIgnored(finding)), [findings, isIgnored]);

  const request = useCallback((finding: SecretFinding) => setActiveFinding(finding), []);
  const cancel = useCallback(() => setActiveFinding(null), []);
  const dismiss = useCallback(() => setPendingReference(null), []);
  const apply = useCallback(
    (finding: SecretFinding, secretName: string) => {
      const result = onChange ? rewriter.apply(text, finding, secretName) : undefined;
      if (result?.applied) {
        onChange!(result.text);
      } else {
        setPendingReference({ finding, secretName, reference: rewriter.reference(secretName) });
      }
      setActiveFinding(null);
    },
    [text, onChange, rewriter]
  );

  const migration = useMemo(
    () => ({ finding: activeFinding, request, cancel, apply }),
    [activeFinding, request, cancel, apply]
  );
  const reference = useMemo(() => ({ pending: pendingReference, dismiss }), [pendingReference, dismiss]);

  return { findings: visible, ignore, migration, reference };
}
