import { type DataSourceJsonData } from '@grafana/data';
import { type DataQuery } from '@grafana/schema';

export interface FixtureQuery extends DataQuery {
  rawSql?: string;
  dataset?: string;
}

export interface FixtureDataSourceOptions extends DataSourceJsonData {
  host?: string;
}

export interface FixtureSecureJsonData {
  password?: string;
}

export const DEFAULT_QUERY: Partial<FixtureQuery> = {
  rawSql: 'SELECT 1',
};
