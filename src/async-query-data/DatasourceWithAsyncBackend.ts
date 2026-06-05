import type {
  DataFrame,
  DataQuery,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceInstanceSettings,
  DataSourceJsonData,
} from '@grafana/data';
import {
  DataSourceWithBackend,
  config,
  getBackendSrv,
  toDataQueryResponse,
  type BackendDataSourceResponse,
} from '@grafana/runtime';
import { merge, of, type Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { lt } from 'semver';
import { getRequestLooper } from './requestLooper';

export interface CustomMeta {
  queryID: string;
  status: string;
}

export interface RunningQueryInfo {
  queryID?: string;
  shouldCancel?: boolean;
}

interface DataQueryMeta {
  meta?: { queryFlow?: 'async' | 'sync' };
}

const RUNNING_STATUSES = ['started', 'submitted', 'running'];
const isRunning = (status = '') => RUNNING_STATUSES.includes(status);
const isCustomMeta = (meta: unknown): meta is CustomMeta => {
  return !!(typeof meta === 'object' && meta?.hasOwnProperty('queryID') && meta?.hasOwnProperty('status'));
};

export class DatasourceWithAsyncBackend<
  TQuery extends DataQuery = DataQuery,
  TOptions extends DataSourceJsonData = DataSourceJsonData,
> extends DataSourceWithBackend<TQuery, TOptions> {
  private runningQueries: { [hash: string]: RunningQueryInfo } = {};
  private requestCounter = 100;
  private requestIdPrefix: number | string;

  constructor(instanceSettings: DataSourceInstanceSettings<TOptions>) {
    super(instanceSettings);
    this.requestIdPrefix = instanceSettings.uid ?? instanceSettings.id;
  }

  query(request: DataQueryRequest<TQuery>): Observable<DataQueryResponse> {
    const targets = this.filterQuery ? request.targets.filter(this.filterQuery) : request.targets;
    if (!targets.length) {
      return of({ data: [] });
    }
    const all: Array<Observable<DataQueryResponse>> = [];
    for (let target of targets) {
      if (target.hide) {
        continue;
      }
      all.push(this.doSingle(target, request));
    }
    return merge(...all);
  }

  storeQuery(target: TQuery, queryInfo: RunningQueryInfo) {
    const key = JSON.stringify(target);
    const existingQueryInfo = this.runningQueries[key] || {};
    this.runningQueries[key] = { ...existingQueryInfo, ...queryInfo };
  }

  getQuery(target: TQuery) {
    const key = JSON.stringify(target);
    return this.runningQueries[key] || {};
  }

  removeQuery(target: TQuery) {
    const key = JSON.stringify(target);
    delete this.runningQueries[key];
  }

  doSingle(target: TQuery, request: DataQueryRequest<TQuery>): Observable<DataQueryResponse> {
    let queryID: string | undefined = undefined;
    let status: string | undefined = undefined;
    let allData: DataFrame[] = [];

    return getRequestLooper(
      { ...request, targets: [target], requestId: `${this.requestIdPrefix}_${this.requestCounter++}` },
      {
        /**
         * Additional query to execute if the current query is still in a running state
         */
        getNextQuery: (rsp: DataQueryResponse) => {
          if (rsp.data?.length) {
            const first: DataFrame = rsp.data[0];
            const meta = first.meta?.custom;

            if (isCustomMeta(meta) && isRunning(meta.status)) {
              queryID = meta.queryID;
              status = meta.status;
              this.storeQuery(target, { queryID });
              return { ...target, queryID };
            }
          }

          this.removeQuery(target);
          return undefined;
        },

        /**
         * The original request
         */
        query: (request: DataQueryRequest<TQuery>) => {
          const { range, targets, requestId, intervalMs, maxDataPoints } = request;
          const [_query] = targets;
          const query: TQuery & DataQueryMeta = {
            ..._query,
            meta: { queryFlow: 'async' },
            intervalMs,
            maxDataPoints,
            // getRef optionally chained to support < v8.3.x of Grafana
            datasource: this?.getRef(),
            datasourceId: this.id,
            ...this.applyTemplateVariables(_query, request.scopedVars),
          };

          // Manually bypass the query cache for running queries if the caching service is not enabled.
          // The caching service handles bypassing the query cache automatically when it is enabled.
          const cachingDisabled = !config.featureToggles.awsAsyncQueryCaching;
          if (cachingDisabled && isRunning(status)) {
            const requestSkipQueryCacheUnsupported = lt(config.buildInfo.version, '10.2.3');
            if (requestSkipQueryCacheUnsupported) {
              return getBackendSrv()
                .fetch<BackendDataSourceResponse>({
                  method: 'POST',
                  url: '/api/ds/query',
                  headers: { 'X-Cache-Skip': true },
                  requestId,
                  data: {
                    queries: [query],
                    range: range,
                    from: range.from.valueOf().toString(),
                    to: range.to.valueOf().toString(),
                  },
                })
                .pipe(
                  map((result) => ({ data: toDataQueryResponse(result).data })),
                  catchError((err) => of(toDataQueryResponse(err)))
                );
            }

            return super.query({ ...request, targets: [query], skipQueryCache: true });
          }

          return super.query({ ...request, targets: [query] });
        },

        /**
         * Process the results
         */
        process: (data: DataFrame[]) => {
          for (const frame of data) {
            if (frame.fields.length > 0) {
              allData.push(frame);
            }
          }

          return allData;
        },

        shouldCancel: () => {
          const { shouldCancel } = this.getQuery(target);
          return !!shouldCancel;
        },

        /**
         * Callback that gets executed when unsubscribed
         */
        onCancel: () => {
          if (queryID) {
            this.removeQuery(target);
            this.postResource('cancel', {
              queryId: queryID,
            }).catch((err) => {
              err.isHandled = true; // avoid the popup
              console.error(`error cancelling query ID: ${queryID}`, err);
            });
          }
        },
      }
    );
  }

  // cancel sets shouldCancel to tell requestLooper to cancel the query
  cancel = (target: TQuery) => {
    this.storeQuery(target, { shouldCancel: true });
  };
}
