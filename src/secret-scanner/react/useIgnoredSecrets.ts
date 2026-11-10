import { useCallback } from 'react';

import { getFindingSignature, type SecretFinding } from '../core/index';
import { useLocalStorageList } from './useLocalStorageList';

const DEFAULT_STORAGE_KEY = 'secretScanner.ignored';

type IgnorableFinding = Pick<SecretFinding, 'type' | 'secret'>;

/**
 * Remembers which detected secrets the user chose to ignore, persisted in
 * localStorage under `storageKey` (namespace it per document). Tracked by a
 * content-derived signature, never the plaintext.
 */
export function useIgnoredSecrets(storageKey: string = DEFAULT_STORAGE_KEY) {
  const [ignored, setIgnored] = useLocalStorageList(storageKey);

  const isIgnored = useCallback(
    (finding: IgnorableFinding) => ignored.includes(getFindingSignature(finding)),
    [ignored]
  );

  const ignore = useCallback(
    (finding: IgnorableFinding) => {
      const signature = getFindingSignature(finding);
      setIgnored((current) => (current.includes(signature) ? current : [...current, signature]));
    },
    [setIgnored]
  );

  return { isIgnored, ignore };
}
