import {
  QueryEditorProps,
  DataTopic,
  dateTime,
  LoadingState,
  TimeRange,
} from '@grafana/data';
import { Chance } from 'chance';

export const mockQueryEditorProps = (): QueryEditorProps<any, any, any> => ({
  datasource: {},
  query: {
    refId: Chance().word(),
    hide: false,
    key: Chance().word(),
    queryType: Chance().word(),
    dataTopic: DataTopic.Annotations,
    datasource: Chance().pickone([Chance().word(), null]),
  },
  onRunQuery: jest.fn(),
  onChange: jest.fn(),
  onBlur: jest.fn(),
  data: {
    state: mockLoadingState(),
    series: [],
    annotations: [],
    timeRange: mockTimeRange(),
  },
  range: mockTimeRange(),
  exploreId: Chance().guid(),
  history: [],
});

export const mockLoadingState = (): LoadingState =>
  Chance().pickone([
    LoadingState.NotStarted,
    LoadingState.Loading,
    LoadingState.Streaming,
    LoadingState.Done,
    LoadingState.Error,
  ]);

export const mockTimeRange = (): TimeRange => ({
  from: dateTime(),
  to: dateTime(),
  raw: {
    from: dateTime(),
    to: dateTime(),
  },
});
