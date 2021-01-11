import { DataSourceSelectItem } from '@grafana/data';

export type DataLinkConfig = {
  field: string;
  label: string;
  matcherRegex: string;
  url: string;
  datasource?: DataSourceSelectItem;
};