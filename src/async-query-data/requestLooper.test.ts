import { getRequestLooper, type RequestLoopOptions } from './requestLooper';
import { TestScheduler } from 'rxjs/testing';
import { of } from 'rxjs';
import { getDefaultTimeRange, type DataQuery, LoadingState, type DataQueryRequest } from '@grafana/data';

const mockQuery: DataQuery = {
  refId: '',
};

const meta = { custom: { status: 'running', queryID: 'queryId' } };

const request = {
  app: 'app',
  interval: '5m',
  intervalMs: 5000,
  requestId: 'requestId',
  scopedVars: {},
  startTime: 1000,
  timezone: 'utc',
  range: getDefaultTimeRange(),
  targets: [mockQuery],
};

const scheduler = new TestScheduler((actual, expected) => {
  expect(actual).toEqual(expected);
});

describe('requestLooper', () => {
  it('can execute a query', () => {
    scheduler.run(({ cold, expectObservable }) => {
      const source = cold('a', {
        a: { data: [], state: LoadingState.Loading, meta },
      });

      const opt: RequestLoopOptions = {
        getNextQuery: jest
          .fn()
          .mockImplementationOnce(() => ({ ...mockQuery, queryId: 'queryId' }))
          .mockImplementationOnce(() => undefined),
        query: jest.fn().mockImplementation(() => source),
        onCancel: jest.fn(),
        process: jest.fn().mockImplementation(() => []),
        shouldCancel: jest.fn().mockImplementation(() => false),
      };

      const looper = getRequestLooper(request, opt);

      expectObservable(looper).toBe('a', {
        a: {
          data: [],
          state: LoadingState.Loading,
          key: 'requestId',
          meta,
        },
      });
    });

    scheduler.flush();
  });

  it('can cancel a running query', () => {
    const onCancel = jest.fn();

    scheduler.run(({ cold, expectObservable }) => {
      const source = cold('a|', {
        a: { data: [], state: LoadingState.Loading, meta },
      });

      const opt: RequestLoopOptions = {
        getNextQuery: jest
          .fn()
          .mockImplementationOnce(() => ({ ...mockQuery, queryId: 'queryId' }))
          .mockImplementationOnce(() => undefined),
        query: jest.fn().mockImplementation(() => source),
        onCancel,
        process: jest.fn().mockImplementation(() => []),
        shouldCancel: jest.fn().mockImplementation(() => true),
      };
      const looper = getRequestLooper(request, opt);

      expectObservable(looper).toBe('a|', {
        a: {
          data: [],
          state: LoadingState.Done,
          key: 'requestId',
          meta,
        },
      });
    });

    scheduler.flush();
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('increments the request id', (done) => {
    let requestIds: string[] = [];

    const queryMock = jest.fn().mockImplementation((req: DataQueryRequest) => {
      requestIds.push(req.requestId);
      return of({ data: [], state: LoadingState.Loading, meta });
    });

    const opt: RequestLoopOptions = {
      getNextQuery: jest
        .fn()
        .mockImplementationOnce(() => ({ ...mockQuery, queryId: 'queryId' }))
        .mockImplementationOnce(() => ({ ...mockQuery, queryId: 'queryId' }))
        .mockImplementationOnce(() => undefined),
      query: (req) => queryMock(req),
      onCancel: jest.fn(),
      process: jest.fn().mockImplementation(() => []),
      shouldCancel: jest.fn().mockImplementation(() => false),
    };

    const looper = getRequestLooper(request, opt);

    looper.subscribe({
      next: () => {},
      complete: () => {
        expect(requestIds).toHaveLength(3);
        expect(requestIds[0]).toBe(request.requestId);
        expect(requestIds[1]).toBe(request.requestId + '.2');
        expect(requestIds[2]).toBe(request.requestId + '.3');
        done();
      },
    });
  });
});
