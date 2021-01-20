import { DataQuery, DataTopic } from '@grafana/data';
import { Chance } from 'chance';
import { undefinedOr } from './utils';

export const mockDataQuery = (): DataQuery => ({
  refId: Chance().word(),
  hide: false,
  key: Chance().guid(),
  queryType: Chance().word(),
  dataTopic: DataTopic.Annotations,
  datasource: undefinedOr(Chance().word),
});
