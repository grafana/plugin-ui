import {
  LoadingState,
  type DataFrame,
  type DataQuery,
  type DataQueryRequest,
  type DataQueryResponse,
} from '@grafana/data';
import { Observable, type Subscription, type Observer } from 'rxjs';

export interface RequestLoopOptions<TQuery extends DataQuery = DataQuery> {
  /**
   * If the response needs an additional request to execute, return it here
   */
  getNextQuery: (rsp: DataQueryResponse) => TQuery | undefined;

  /**
   * The datasource execute method
   */
  query: (req: DataQueryRequest<TQuery>) => Observable<DataQueryResponse>;

  /**
   * Process the results
   */
  process: (data: DataFrame[]) => DataFrame[];

  /**
   * Check if the query should be cancelled
   */
  shouldCancel: () => boolean;

  /**
   * Callback that gets executed when unsubscribed
   */
  onCancel: () => void;
}

const DELAY_INTERVAL_MS = 10;
const MAX_NEXT_REQUEST_DELAY = 10000 / DELAY_INTERVAL_MS; // 10 seconds maximum delay between requests

/**
 * Continue executing requests as long as `getNextQuery` returns a query
 */
export function getRequestLooper<T extends DataQuery = DataQuery>(
  req: DataQueryRequest<T>,
  options: RequestLoopOptions<T>
): Observable<DataQueryResponse> {
  return new Observable<DataQueryResponse>((subscriber) => {
    let nextQuery: T | undefined = undefined;
    let subscription: Subscription | undefined = undefined;
    let loadingState: LoadingState | undefined = LoadingState.Loading;
    let nextRequestDelay = 1; // number of DELAY_INTERVAL_MS to wait before the next request
    let count = 1;
    let shouldCancel = false;

    // Single observer gets reused for each request
    const observer: Observer<DataQueryResponse> = {
      next: (rsp: DataQueryResponse) => {
        loadingState = rsp.state;
        let checkstate = false;
        if (loadingState !== LoadingState.Error) {
          nextQuery = options.getNextQuery(rsp);
          const _shouldCancel = options.shouldCancel();

          if (nextQuery && _shouldCancel) {
            // `shouldCancel` is set here only if there is a `nextQuery`, otherwise
            // we would try to cancel a finished query in the cleanup function
            shouldCancel = _shouldCancel;
            nextQuery = undefined;
          }

          checkstate = true;
        }
        const data = options.process(rsp.data);

        // Set the loading status to show a spinner if loading or to show data if streaming.
        if (checkstate) {
          if (nextQuery) {
            if (data.length && data[0].length) {
              loadingState = LoadingState.Streaming;
            } else {
              loadingState = LoadingState.Loading;
            }
            // Calculate the number of DELAY_INTERVAL_MS to wait before the next request.
            // Caps it so the delay is not more than 10s
            nextRequestDelay =
              nextRequestDelay * 2 > MAX_NEXT_REQUEST_DELAY ? MAX_NEXT_REQUEST_DELAY : nextRequestDelay * 2;
          } else {
            loadingState = LoadingState.Done;
            nextRequestDelay = 0;
          }
        }
        subscriber.next({ ...rsp, data, state: loadingState, key: req.requestId });
      },
      error: (err) => {
        subscriber.error(err);
      },
      complete: () => {
        // We unsubscribe from the internal subscription after completing a request
        if (subscription) {
          subscription.unsubscribe();
          subscription = undefined;
        }

        // Queues up a new request if the current query is still in a running state.
        // The timeout is set in the `next` callback.
        if (nextQuery) {
          const next = nextQuery;
          setTimeout(() => {
            subscription = options
              .query({ ...req, requestId: `${req.requestId}.${++count}`, targets: [next] })
              .subscribe(observer);
            nextQuery = undefined;
          }, nextRequestDelay * DELAY_INTERVAL_MS);
        } else {
          subscriber.complete();
        }
      },
    };

    // This runs the initial query, subsequent queries are run in the `complete` callback of the observer.
    subscription = options.query(req).subscribe(observer);

    // Cleanup function
    return function unsubscribe() {
      observer.complete();
      if (nextQuery || shouldCancel) {
        options.onCancel();
      }
      nextQuery = undefined;
    };
  });
}
