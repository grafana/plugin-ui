import { DataSourceSelectItem } from '@grafana/data';

export type DataLinkConfig = {
  field: string;
  url: string;
  datasource?: DataSourceSelectItem;
};