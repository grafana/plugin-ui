import { type DataSourceSettings, type DataSourceJsonData } from '@grafana/data';

type DataSourceExclusiveConfig = {
  readOnly: DataSourceSettings['readOnly'];
  url: DataSourceSettings['url'];
  basicAuth: DataSourceSettings['basicAuth'];
  basicAuthUser: DataSourceSettings['basicAuthUser'];
  withCredentials: DataSourceSettings['withCredentials'];
};

export type Config<JSONData extends DataSourceJsonData = any, SecureJSONData = {}> = {
  jsonData: DataSourceSettings<JSONData>['jsonData'];
  secureJsonData?: DataSourceSettings<JSONData, SecureJSONData>['secureJsonData'];
  secureJsonFields: DataSourceSettings['secureJsonFields'];
} & Partial<DataSourceExclusiveConfig>;

export type OnChangeHandler<C extends Config = Config> = (config: C) => void;
