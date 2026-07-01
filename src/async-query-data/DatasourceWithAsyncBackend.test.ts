import {
  type DataQuery,
  type DataQueryRequest,
  type DataSourceInstanceSettings,
  PluginType,
  getDefaultTimeRange,
} from '@grafana/data';
import { DataSourceWithBackend } from '@grafana/runtime';
import { DatasourceWithAsyncBackend } from './DatasourceWithAsyncBackend';
import { type RequestLoopOptions } from './requestLooper';

const queryMock = jest.fn().mockImplementation(() => Promise.resolve({ data: [] }));
jest.spyOn(DataSourceWithBackend.prototype, 'query').mockImplementation(queryMock);

const getRequestLooperMock = jest.fn();
jest.mock('./requestLooper.ts', () => ({
  ...jest.requireActual('./requestLooper.ts'),
  getRequestLooper: (req: DataQueryRequest, options: RequestLoopOptions) => getRequestLooperMock(req, options),
}));

const defaultInstanceSettings: DataSourceInstanceSettings<{}> = {
  id: 12,
  uid: 'test',
  type: 'test',
  name: 'test',
  meta: {
    id: 'test',
    name: 'test',
    type: PluginType.datasource,
    info: {
      author: {
        name: 'test',
      },
      description: 'test',
      links: [],
      logos: {
        large: '',
        small: '',
      },
      screenshots: [],
      updated: '',
      version: '',
    },
    module: '',
    baseUrl: '',
  },
  access: 'direct',
  jsonData: {},
  readOnly: false,
};
const defaultQuery = { refId: 'refId-1' };
const defaultQuery2 = { refId: 'refId-2' };
const defaultRequest = {
  requestId: 'requestId',
  interval: '1',
  intervalMs: 1,
  range: getDefaultTimeRange(),
  scopedVars: {},
  targets: [defaultQuery, defaultQuery2],
  timezone: 'utc',
  app: 'test',
  startTime: 0,
};

const setupDatasourceWithAsyncBackend = (settings: DataSourceInstanceSettings = defaultInstanceSettings) =>
  new DatasourceWithAsyncBackend<DataQuery>(settings);

describe('DatasourceWithAsyncBackend', () => {
  // beforeAll(() => {
  //   queryMock.mockClear();
  // });

  it('can store running queries', () => {
    const ds = setupDatasourceWithAsyncBackend();

    ds.storeQuery(defaultQuery, { queryID: '123' });
    expect(ds.getQuery(defaultQuery)).toEqual({ queryID: '123' });
  });

  it('can remove running queries', () => {
    const ds = setupDatasourceWithAsyncBackend();

    ds.storeQuery(defaultQuery, { queryID: '123' });
    expect(ds.getQuery(defaultQuery)).toEqual({ queryID: '123' });
    ds.removeQuery(defaultQuery);
    expect(ds.getQuery(defaultQuery)).toEqual({});
  });

  it('can cancel running queries', () => {
    const ds = setupDatasourceWithAsyncBackend();

    ds.storeQuery(defaultQuery, { queryID: '123' });
    ds.cancel(defaultQuery);
    expect(ds.getQuery(defaultQuery)).toEqual({ queryID: '123', shouldCancel: true });
  });

  it('will queue individual queries to run asynchronously', () => {
    const ds = setupDatasourceWithAsyncBackend();

    ds.doSingle = jest.fn().mockReturnValue(Promise.resolve({ data: [] }));
    expect(ds.doSingle).not.toHaveBeenCalled();
    ds.query(defaultRequest);
    expect(ds.doSingle).toHaveBeenCalledTimes(2);
    expect(ds.doSingle).toHaveBeenCalledWith(defaultQuery, defaultRequest);
    expect(ds.doSingle).toHaveBeenCalledWith(defaultQuery2, defaultRequest);
  });

  it('uses the datasource uid for the request uid', () => {
    const ds = setupDatasourceWithAsyncBackend();
    expect(getRequestLooperMock).not.toHaveBeenCalled();
    ds.doSingle(defaultQuery, defaultRequest);
    expect(getRequestLooperMock).toHaveBeenCalledTimes(1);
    const expectedRequest = {
      ...defaultRequest,
      targets: [defaultQuery],
      requestId: 'test_100',
    };
    expect(getRequestLooperMock).toHaveBeenCalledWith(expectedRequest, expect.anything());
  });
});
