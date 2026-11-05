import React, { useEffect, useRef, useState } from 'react';
import { Stack, Select } from '@grafana/ui';
import { type DataSourceInstanceSettings, type SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { getDataSourceInstanceSettings, useDataSourceInstanceList } from '@grafana/plugin-compat/datasources';
import { isUnsignedPluginSignature, PluginSignatureBadge } from '../Plugins/PluginSignatureBadge';

export interface Props {
  onChange: (ds: DataSourceInstanceSettings) => void;
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

type CurrentDataSource =
  | { status: 'loading'; previous?: DataSourceInstanceSettings }
  | { status: 'found'; settings: DataSourceInstanceSettings }
  | { status: 'not-found' };

/** Resolves `current` (uid, name, or null for the default) and ignores results that arrive after it changed. */
function useCurrentDataSource(current: string | null, skip: boolean): CurrentDataSource {
  const [result, setResult] = useState<{ key: string | null; value: CurrentDataSource }>({
    key: current,
    value: { status: 'loading' },
  });

  useEffect(() => {
    if (skip) {
      return;
    }
    let isCurrent = true;
    getDataSourceInstanceSettings(current).then(
      (settings) => {
        if (isCurrent) {
          setResult({ key: current, value: settings ? { status: 'found', settings } : { status: 'not-found' } });
        }
      },
      () => {
        if (isCurrent) {
          setResult({ key: current, value: { status: 'not-found' } });
        }
      }
    );
    return () => {
      isCurrent = false;
    };
  }, [current, skip]);

  if (result.key === current) {
    return result.value;
  }
  // Keep the previous value visible so the Select does not flash its placeholder after a selection.
  return { status: 'loading', previous: result.value.status === 'found' ? result.value.settings : undefined };
}

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
  const showNoDatasources = !current && noDefault;
  const { items, isLoading: isListLoading, error: listError } = useDataSourceInstanceList();
  const currentDataSource = useCurrentDataSource(current, !!showNoDatasources);
  const [selectionFailed, setSelectionFailed] = useState(false);

  // Only the latest selection may call `onChange`, and nothing may after unmount.
  const latestSelection = useRef(0);
  useEffect(
    () => () => {
      latestSelection.current = -1;
    },
    []
  );

  const handleChange = async (item: SelectableValue<string>) => {
    const selection = ++latestSelection.current;
    const isStale = () => latestSelection.current !== selection;
    try {
      const settings = await getDataSourceInstanceSettings(item.value!);
      if (isStale()) {
        return;
      }
      if (settings) {
        onChange(settings);
        setSelectionFailed(false);
      }
    } catch {
      if (!isStale()) {
        setSelectionFailed(true);
      }
    }
  };

  const options: Array<SelectableValue<string>> = items.map((ds) => ({
    value: ds.uid,
    label: ds.name,
    imgUrl: ds.meta.info.logos.small,
    meta: ds.meta,
  }));

  const value = getCurrentValue(current, currentDataSource, { hideTextValue, noDefault });
  const invalid = !!listError || selectionFailed || currentDataSource.status === 'not-found';

  return (
    <div aria-label={selectors.components.DataSourcePicker.container}>
      <Select
        className="ds-picker select-container"
        isMulti={false}
        isClearable={false}
        backspaceRemovesValue={false}
        onChange={handleChange}
        options={options}
        isLoading={isListLoading || (!showNoDatasources && currentDataSource.status === 'loading')}
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

function getCurrentValue(
  current: string | null,
  currentDataSource: CurrentDataSource,
  { hideTextValue, noDefault }: Pick<Props, 'hideTextValue' | 'noDefault'>
): SelectableValue<string> | undefined {
  if (!current && noDefault) {
    return {
      label: 'No datasources found',
    };
  }

  if (currentDataSource.status === 'loading') {
    return currentDataSource.previous && toOption(currentDataSource.previous, hideTextValue);
  }

  if (currentDataSource.status === 'found') {
    return toOption(currentDataSource.settings, hideTextValue);
  }

  return {
    label: (current ?? 'no name') + ' - not found',
    value: (current ?? 'no name') + ' - not found',
    imgUrl: '',
    hideText: hideTextValue,
  };
}

function toOption(ds: DataSourceInstanceSettings, hideTextValue?: boolean): SelectableValue<string> {
  return {
    label: ds.name.substr(0, 37),
    value: ds.name,
    imgUrl: ds.meta.info.logos.small,
    hideText: hideTextValue,
    meta: ds.meta,
  };
}
