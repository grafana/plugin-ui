import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './datasource';
import { ConfigEditor } from './components/ConfigEditor';
import { QueryEditor } from './components/QueryEditor';
import { type FixtureDataSourceOptions, type FixtureQuery } from './types';

export const plugin = new DataSourcePlugin<DataSource, FixtureQuery, FixtureDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor);
