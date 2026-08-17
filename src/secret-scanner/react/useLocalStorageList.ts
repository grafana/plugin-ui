import { useCallback, useEffect, useRef, useState } from 'react';

function read(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

type Updater = string[] | ((prev: string[]) => string[]);

export function useLocalStorageList(key: string): [string[], (updater: Updater) => void] {
  const [value, setValue] = useState<string[]>(() => read(key));
  const keyRef = useRef(key);

  useEffect(() => {
    if (keyRef.current !== key) {
      keyRef.current = key;
      setValue(read(key));
    }
  }, [key]);

  const set = useCallback(
    (updater: Updater) => {
      setValue((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {
          // Ignore write failures (private mode, quota, …).
        }
        return next;
      });
    },
    [key]
  );

  return [value, set];
}
