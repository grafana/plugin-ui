import { type DataQuery } from '@grafana/data';
import { Chance } from 'chance';
import { undefinedOr } from './utils';

export const mockDataQuery = (): DataQuery => ({
  refId: Chance().word(),
  hide: false,
  key: Chance().guid(),
  queryType: Chance().word(),
  datasource: undefinedOr(() => Chance().word()),
});
