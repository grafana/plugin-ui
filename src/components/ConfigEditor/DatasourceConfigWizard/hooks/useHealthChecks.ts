import { useCallback, useRef, useState } from 'react';
import { getBackendSrv } from '@grafana/runtime';
import type { TestDataSourceResponse } from '@grafana/data';

const MAX_CONCURRENCY = 5;

export type HealthState = 'pending' | 'checking' | 'done';

export interface DatasourceHealth {
  state: HealthState;
  status?: string;
  message?: string;
}

/**
 * Health check hook — on-demand only.
 * Call `checkUids(uids)` to trigger checks for specific UIDs.
 * Call `retry(uid)` to force re-check a single UID.
 * UIDs that have already been checked (or are in-flight) are automatically skipped.
 */
export function useHealthChecks() {
  const [healthMap, setHealthMap] = useState<Record<string, DatasourceHealth>>({});
  const queueRef = useRef<string[]>([]);
  const activeRef = useRef(0);
  const mountedRef = useRef(true);
  // Permanent set of UIDs that have ever been queued — prevents re-checking on re-render.
  // Only `retry()` removes from this set to allow explicit re-check.
  const everQueuedRef = useRef(new Set<string>());

  const checkOne = useCallback(async (uid: string) => {
    if (!mountedRef.current) {
      return;
    }
    setHealthMap((prev) => ({ ...prev, [uid]: { state: 'checking' } }));

    try {
      const result: TestDataSourceResponse = await getBackendSrv().get(
        `/api/datasources/uid/${uid}/health`,
        undefined,
        undefined,
        { showErrorAlert: false }
      );
      if (!mountedRef.current) {
        return;
      }
      setHealthMap((prev) => ({
        ...prev,
        [uid]: { state: 'done', status: result.status ?? 'OK', message: result.message },
      }));
    } catch (error: unknown) {
      if (!mountedRef.current) {
        return;
      }
      let status = 'ERROR';
      let message = '';
      if (error && typeof error === 'object' && 'data' in error) {
        const data = (error as { data?: { status?: string; message?: string } }).data;
        if (data?.status) {
          status = data.status;
        }
        if (data?.message) {
          message = data.message;
        }
      }
      if (!message) {
        message = error instanceof Error ? error.message : String(error);
      }
      setHealthMap((prev) => ({
        ...prev,
        [uid]: { state: 'done', status, message },
      }));
    }
  }, []);

  const processQueue = useCallback(() => {
    while (activeRef.current < MAX_CONCURRENCY && queueRef.current.length > 0) {
      const uid = queueRef.current.shift()!;
      activeRef.current++;
      checkOne(uid).finally(() => {
        activeRef.current--;
        processQueue();
      });
    }
  }, [checkOne]);

  /**
   * Queue health checks for a batch of UIDs.
   * Skips UIDs that have ever been queued before (idempotent — safe to call repeatedly).
   */
  const checkUids = useCallback(
    (uids: string[]) => {
      const toCheck: string[] = [];
      for (const uid of uids) {
        if (everQueuedRef.current.has(uid)) {
          continue;
        }
        everQueuedRef.current.add(uid);
        toCheck.push(uid);
      }
      if (toCheck.length === 0) {
        return;
      }
      setHealthMap((prev) => {
        const next = { ...prev };
        for (const uid of toCheck) {
          next[uid] = { state: 'pending' };
        }
        return next;
      });
      queueRef.current.push(...toCheck);
      processQueue();
    },
    [processQueue]
  );

  /**
   * Force re-check a single UID (e.g. after wizard save).
   * Clears the "ever queued" flag so checkUids won't block it.
   */
  const retry = useCallback(
    (uid: string) => {
      // Remove from everQueued so it can be re-queued
      everQueuedRef.current.delete(uid);
      // Re-add immediately
      everQueuedRef.current.add(uid);
      setHealthMap((prev) => ({ ...prev, [uid]: { state: 'pending' } }));
      queueRef.current.push(uid);
      processQueue();
    },
    [processQueue]
  );

  return { healthMap, checkUids, retry };
}
