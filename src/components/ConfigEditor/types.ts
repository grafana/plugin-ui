import { DataSourceSettings, DataSourceJsonData, PluginMeta } from '@grafana/data';

export type Config<JSONData extends DataSourceJsonData = any, SecureJSONData = any> = DataSourceSettings<
  JSONData,
  SecureJSONData
>;

export type AppConfig<JSONData extends DataSourceJsonData = any> = PluginMeta<JSONData>;

export type CommonConfig = Config | AppConfig;

export type OnChangeHandler<C extends Config = Config> = (config: C) => void;

export type OnCommonChangeHandler<C extends CommonConfig = CommonConfig> = (config: C) => void;
