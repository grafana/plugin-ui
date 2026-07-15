import {
  PluginSignatureStatus,
  PluginType,
  type DataSourceApi,
  type DataSourceInstanceSettings,
  type DataSourcePluginMeta,
} from '@grafana/data';
import { setDataSourceSrv, type DataSourceSrv, type GetDataSourceListFilters } from '@grafana/runtime';
import React, { useState } from 'react';
import { DataSourcePicker } from './DataSourcePicker';

const createMeta = (
  pluginId: string,
  logo: string,
  signature: PluginSignatureStatus,
  capabilities: Partial<DataSourcePluginMeta> = {}
): DataSourcePluginMeta => ({
  id: pluginId,
  name: pluginId,
  type: PluginType.datasource,
  module: `app/plugins/datasource/${pluginId}/module`,
  baseUrl: `public/app/plugins/datasource/${pluginId}`,
  signature,
  info: {
    author: { name: 'Grafana Labs', url: 'https://grafana.com' },
    description: `${pluginId} data source`,
    links: [],
    logos: { small: logo, large: logo },
    screenshots: [],
    updated: '2024-01-01',
    version: '1.0.0',
  },
  ...capabilities,
});

const createDataSource = (
  settings: Pick<DataSourceInstanceSettings, 'id' | 'uid' | 'name' | 'type' | 'meta'> &
    Partial<DataSourceInstanceSettings>
): DataSourceInstanceSettings => ({
  access: 'proxy',
  readOnly: false,
  jsonData: {},
  url: '',
  ...settings,
});

const mockDataSources: DataSourceInstanceSettings[] = [
  createDataSource({
    id: 1,
    uid: 'prometheus-uid',
    name: 'Prometheus',
    type: 'prometheus',
    isDefault: true,
    meta: createMeta(
      'prometheus',
      `https://raw.githubusercontent.com/grafana/grafana-prometheus-datasource/refs/heads/main/src/img/prometheus_logo.svg`,
      PluginSignatureStatus.internal,
      { metrics: true, alerting: true, backend: true }
    ),
  }),
  createDataSource({
    id: 2,
    uid: 'loki-uid',
    name: 'Loki',
    type: 'loki',
    meta: createMeta(
      'loki',
      `https://raw.githubusercontent.com/grafana/grafana-loki-datasource/refs/heads/main/src/img/loki_icon.svg`,
      PluginSignatureStatus.internal,
      { logs: true, backend: true }
    ),
  }),
  createDataSource({
    id: 3,
    uid: 'tempo-uid',
    name: 'Tempo',
    type: 'tempo',
    meta: createMeta(
      'tempo',
      `https://raw.githubusercontent.com/grafana/grafana-tempo-datasource/refs/heads/main/src/img/tempo_logo.svg`,
      PluginSignatureStatus.internal,
      { tracing: true, backend: true }
    ),
  }),
  // An unsigned third-party datasource to exercise the PluginSignatureBadge shown in the options.
  createDataSource({
    id: 4,
    uid: 'acme-uid',
    name: 'ACME Metrics',
    type: 'acme-metrics-datasource',
    meta: createMeta(
      'acme-metrics-datasource',
      `https://raw.githubusercontent.com/grafana/grafana/refs/heads/main/public/img/grafana_icon.svg`,
      PluginSignatureStatus.missing,
      { metrics: true }
    ),
  }),
];

const filterDataSources = (
  list: DataSourceInstanceSettings[],
  filters?: GetDataSourceListFilters
): DataSourceInstanceSettings[] => {
  if (!filters) {
    return list;
  }

  return list.filter((ds) => {
    if (filters.type) {
      const allowedTypes = Array.isArray(filters.type) ? filters.type : [filters.type];
      if (!allowedTypes.includes(ds.type)) {
        return false;
      }
    }
    if (filters.pluginId && ds.meta.id !== filters.pluginId) {
      return false;
    }
    if (filters.metrics && !ds.meta.metrics) {
      return false;
    }
    if (filters.tracing && !ds.meta.tracing) {
      return false;
    }
    if (filters.logs && !ds.meta.logs) {
      return false;
    }
    if (filters.annotations && !ds.meta.annotations) {
      return false;
    }
    if (filters.alerting && !ds.meta.alerting) {
      return false;
    }
    if (filters.filter && !filters.filter(ds)) {
      return false;
    }
    return true;
  });
};

const findDataSource = (ref?: Parameters<DataSourceSrv['getInstanceSettings']>[0]) => {
  if (!ref) {
    return undefined;
  }
  const key = typeof ref === 'string' ? ref : ref.uid;
  return mockDataSources.find((ds) => ds.uid === key || ds.name === key);
};

// A mock DataSourceSrv so DataSourcePicker's getDataSourceSrv() resolves inside Storybook.
const mockDataSourceSrv: DataSourceSrv = {
  getList: (filters) => filterDataSources(mockDataSources, filters),
  getInstanceSettings: (ref) => findDataSource(ref),
  get: (ref) => Promise.resolve(findDataSource(ref) as unknown as DataSourceApi),
  reload: () => Promise.resolve(),
  registerRuntimeDataSource: () => {},
};

setDataSourceSrv(mockDataSourceSrv);

export default {
  title: 'Components/DataSourcePicker',
  component: DataSourcePicker,
};

export const Basic = () => {
  const [current, setCurrent] = useState<string | null>('prometheus-uid');

  return <DataSourcePicker current={current} onChange={(ds) => setCurrent(ds.uid)} />;
};

export const NotFound = () => {
  const [current, setCurrent] = useState<string | null>('missing-datasource-uid');

  return <DataSourcePicker current={current} onChange={(ds) => setCurrent(ds.uid)} />;
};
