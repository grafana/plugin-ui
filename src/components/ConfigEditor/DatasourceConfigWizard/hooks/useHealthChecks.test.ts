import { renderHook, act, waitFor } from '@testing-library/react';
import { setBackendSrv, type BackendSrv } from '@grafana/runtime';
import { useHealthChecks } from './useHealthChecks';

const setGet = (get: jest.Mock) => setBackendSrv({ get } as unknown as BackendSrv);

describe('useHealthChecks', () => {
  it('marks a datasource done with status and message on success', async () => {
    setGet(jest.fn().mockResolvedValue({ status: 'OK', message: 'Data source is working' }));
    const { result } = renderHook(() => useHealthChecks());

    act(() => result.current.checkUids(['ds-a']));

    await waitFor(() => expect(result.current.healthMap['ds-a']?.state).toBe('done'));
    expect(result.current.healthMap['ds-a']).toEqual({
      state: 'done',
      status: 'OK',
      message: 'Data source is working',
    });
  });

  it('defaults status to OK when the response omits it', async () => {
    setGet(jest.fn().mockResolvedValue({ message: 'up' }));
    const { result } = renderHook(() => useHealthChecks());

    act(() => result.current.checkUids(['ds-a']));

    await waitFor(() => expect(result.current.healthMap['ds-a']?.state).toBe('done'));
    expect(result.current.healthMap['ds-a']?.status).toBe('OK');
  });

  it('does not re-check a UID that was already queued', async () => {
    const get = jest.fn().mockResolvedValue({ status: 'OK' });
    setGet(get);
    const { result } = renderHook(() => useHealthChecks());

    act(() => result.current.checkUids(['ds-a']));
    await waitFor(() => expect(result.current.healthMap['ds-a']?.state).toBe('done'));

    act(() => result.current.checkUids(['ds-a']));
    expect(get).toHaveBeenCalledTimes(1);
  });

  it('extracts status and message from an error response', async () => {
    setGet(jest.fn().mockRejectedValue({ data: { status: 'ERROR', message: 'bad credentials' } }));
    const { result } = renderHook(() => useHealthChecks());

    act(() => result.current.checkUids(['ds-a']));

    await waitFor(() => expect(result.current.healthMap['ds-a']?.state).toBe('done'));
    expect(result.current.healthMap['ds-a']).toEqual({ state: 'done', status: 'ERROR', message: 'bad credentials' });
  });

  it('falls back to the Error message when the error has no data', async () => {
    setGet(jest.fn().mockRejectedValue(new Error('boom')));
    const { result } = renderHook(() => useHealthChecks());

    act(() => result.current.checkUids(['ds-a']));

    await waitFor(() => expect(result.current.healthMap['ds-a']?.state).toBe('done'));
    expect(result.current.healthMap['ds-a']?.status).toBe('ERROR');
    expect(result.current.healthMap['ds-a']?.message).toBe('boom');
  });

  it('retry re-checks a previously completed UID', async () => {
    const get = jest.fn().mockResolvedValue({ status: 'OK' });
    setGet(get);
    const { result } = renderHook(() => useHealthChecks());

    act(() => result.current.checkUids(['ds-a']));
    await waitFor(() => expect(result.current.healthMap['ds-a']?.state).toBe('done'));

    act(() => result.current.retry('ds-a'));
    await waitFor(() => expect(get).toHaveBeenCalledTimes(2));
  });
});
