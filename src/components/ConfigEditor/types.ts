import { DataSourceSettings, DataSourceJsonData, PluginMeta } from '@grafana/data';

export type Config<JSONData extends DataSourceJsonData = any, SecureJSONData = any> =
  | DataSourceSettings<JSONData, SecureJSONData>
  | PluginMeta<JSONData>;
export type OnChangeHandler<C extends Config = Config> = (config: C) => void;
