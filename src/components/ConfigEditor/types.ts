import { DataSourceSettings, DataSourceJsonData } from '@grafana/data';

export type Config<JSONData extends DataSourceJsonData = any, SecureJSONData = any> = DataSourceSettings<
  JSONData,
  SecureJSONData
>;
export type OnChangeHandler<C extends Config = Config> = (config: C) => void;
