import React from 'react';
import { Stack, Select } from '@grafana/ui';
import { type DataSourceInstanceSettings, type SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { useDataSourceInstanceList, useDefaultDataSourceInstanceListItem } from '@grafana/plugin-compat/datasources';
import { isUnsignedPluginSignature, PluginSignatureBadge } from '../Plugins/PluginSignatureBadge';

export interface Props {
  // Mirrors `DataSourceInstanceListItem` instead of importing it: `@grafana/data` only exports it from 13.3,
  // so with our `^13.0.0` peer range consumers on 13.0–13.2 would get `any`. Callbacks typed with the real
  // `DataSourceInstanceListItem` (13.3+) still fit because the shapes are identical.
  /**
   * Receives the selected data source's list item (`uid`, `type`, `name`, `meta`). Call
   * `getDataSourceInstanceSettings(ds.uid)` from `@grafana/plugin-compat` if you need the full settings.
   */
  onChange: (ds: Pick<DataSourceInstanceSettings, 'uid' | 'type' | 'name' | 'meta'>) => void;
  /** Uid or name of the selected data source. `null`/`undefined` resolves to the default data source. */
  current?: string | null;
  hideTextValue?: boolean;
  onBlur?: () => void;
  autoFocus?: boolean;
  openMenuOnFocus?: boolean;
  placeholder?: string;
  tracing?: boolean;
  mixed?: boolean;
  dashboard?: boolean;
  metrics?: boolean;
  annotations?: boolean;
  variables?: boolean;
  pluginId?: string;
  noDefault?: boolean;
}

type DataSourceListItem = Parameters<Props['onChange']>[0];

// Stable reference, so the default lookup does not re-run when it is not needed.
const NO_ITEMS: DataSourceListItem[] = [];

export function DataSourcePicker({
  onChange,
  current: currentProp,
  hideTextValue,
  onBlur,
  autoFocus = false,
  openMenuOnFocus = false,
  placeholder = 'Select datasource',
  noDefault,
}: Props) {
  const current = currentProp ?? null;
  const showNoDatasources = !current && !!noDefault;
  const needsDefault = !current && !noDefault;
  const { items, isLoading: isListLoading, error: listError } = useDataSourceInstanceList();
  const { item: defaultItem, isLoading: isDefaultLoading } = useDefaultDataSourceInstanceListItem(
    needsDefault ? items : NO_ITEMS
  );
  const selected = current ? findByUidOrName(items, current) : defaultItem;
  const isLoading = isListLoading || (needsDefault && isDefaultLoading);
  const notFound = !selected && !isLoading && !listError && !showNoDatasources;

  const handleChange = (option: SelectableValue<string>) => {
    const item = items.find((ds) => ds.uid === option.value);
    if (item) {
      onChange(item);
    }
  };

  const options: Array<SelectableValue<string>> = items.map((ds) => ({
    value: ds.uid,
    label: ds.name,
    imgUrl: ds.meta.info.logos.small,
    meta: ds.meta,
  }));

  const value = getCurrentValue({ current, selected, notFound, showNoDatasources, hideTextValue });
  const invalid = !!listError || notFound;

  return (
    <div aria-label={selectors.components.DataSourcePicker.container}>
      <Select
        className="ds-picker select-container"
        isMulti={false}
        isClearable={false}
        backspaceRemovesValue={false}
        onChange={handleChange}
        options={options}
        isLoading={isLoading}
        autoFocus={autoFocus}
        onBlur={onBlur}
        openMenuOnFocus={openMenuOnFocus}
        maxMenuHeight={500}
        placeholder={placeholder}
        noOptionsMessage={listError ? 'Could not load data sources' : 'No datasources found'}
        value={value}
        invalid={invalid}
        aria-invalid={invalid}
        getOptionLabel={(o) => {
          if (o.meta && isUnsignedPluginSignature(o.meta.signature) && o !== value) {
            return (
              <Stack alignItems="center" justifyContent="space-between">
                <span>{o.label}</span> <PluginSignatureBadge status={o.meta.signature} />
              </Stack>
            );
          }
          return o.label || '';
        }}
      />
    </div>
  );
}

function findByUidOrName(items: DataSourceListItem[], ref: string): DataSourceListItem | undefined {
  return items.find((ds) => ds.uid === ref) ?? items.find((ds) => ds.name === ref);
}

function getCurrentValue({
  current,
  selected,
  notFound,
  showNoDatasources,
  hideTextValue,
}: {
  current: string | null;
  selected?: DataSourceListItem;
  notFound: boolean;
  showNoDatasources: boolean;
  hideTextValue?: boolean;
}): SelectableValue<string> | undefined {
  if (showNoDatasources) {
    return {
      label: 'No datasources found',
    };
  }

  if (selected) {
    return toOption(selected, hideTextValue);
  }

  if (!notFound) {
    return undefined;
  }

  return {
    label: (current ?? 'no name') + ' - not found',
    value: (current ?? 'no name') + ' - not found',
    imgUrl: '',
    hideText: hideTextValue,
  };
}

function toOption(ds: DataSourceListItem, hideTextValue?: boolean): SelectableValue<string> {
  return {
    label: ds.name.substr(0, 37),
    value: ds.name,
    imgUrl: ds.meta.info.logos.small,
    hideText: hideTextValue,
    meta: ds.meta,
  };
}
