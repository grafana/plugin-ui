import { useRef, useEffect, useMemo } from 'react';

/**
 * Returns a stable callback that always calls the latest version of the provided callback.
 * Useful for avoiding stale closures in imperative APIs like Monaco editor callbacks.
 *
 * @param callback The callback function that may change between renders (can be undefined)
 * @returns A stable callback reference that always calls the latest version, or undefined if no callback provided
 */
export function useLatestCallback<T extends (...args: any[]) => unknown>(callback: T | undefined): T | undefined {
  const ref = useRef(callback);

  useEffect(() => {
    ref.current = callback;
  });

  const hasCallback = Boolean(callback);

  return useMemo(
    () => (hasCallback ? (((...args: Parameters<T>) => ref.current!(...args)) as T) : undefined),
    [hasCallback]
  );
}
