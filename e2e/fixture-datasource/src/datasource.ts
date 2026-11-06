import {
  DataSourceApi,
  type DataQueryRequest,
  type DataQueryResponse,
  type DataSourceInstanceSettings,
  type TestDataSourceResponse,
} from '@grafana/data';
import { type FixtureDataSourceOptions, type FixtureQuery } from './types';

/**
 * Frontend-only data source. It exists purely to host the `@grafana/plugin-ui`
 * ConfigEditor and QueryEditor so they can be rendered inside a real Grafana
 * instance during e2e tests. It never talks to a backend.
 */
export class DataSource extends DataSourceApi<FixtureQuery, FixtureDataSourceOptions> {
  constructor(instanceSettings: DataSourceInstanceSettings<FixtureDataSourceOptions>) {
    super(instanceSettings);
  }

  async query(_request: DataQueryRequest<FixtureQuery>): Promise<DataQueryResponse> {
    return { data: [] };
  }

  async testDatasource(): Promise<TestDataSourceResponse> {
    return { status: 'success', message: 'Fixture data source is a frontend-only stub.' };
  }
}
