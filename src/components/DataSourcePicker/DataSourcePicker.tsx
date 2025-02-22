// Libraries
import React, { PureComponent } from 'react';

// Components
import { HorizontalGroup, Select } from '@grafana/ui';
import { type DataSourceInstanceSettings, type SelectableValue } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';
import { isUnsignedPluginSignature, PluginSignatureBadge } from '../Plugins/PluginSignatureBadge';
import { getDataSourceSrv, type DataSourceSrv } from '@grafana/runtime';

export interface Props {
  onChange: (ds: DataSourceInstanceSettings) => void;
  current: string | null;
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

export interface State {
  error?: string;
}

export class DataSourcePicker extends PureComponent<Props, State> {
  dataSourceSrv: DataSourceSrv = getDataSourceSrv();

  static defaultProps: Partial<Props> = {
    autoFocus: false,
    openMenuOnFocus: false,
    placeholder: 'Select datasource',
  };

  state: State = {};

  constructor(props: Props) {
    super(props);
  }

  componentDidMount() {
    const { current } = this.props;
    const dsSettings = this.dataSourceSrv.getInstanceSettings(current!);
    if (!dsSettings) {
      this.setState({ error: 'Could not find data source ' + current });
    }
  }

  onChange = (item: SelectableValue<string>) => {
    const dsSettings = this.dataSourceSrv.getInstanceSettings(item.value!);

    if (dsSettings) {
      this.props.onChange(dsSettings);
      this.setState({ error: undefined });
    }
  };

  private getCurrentValue(): SelectableValue<string> {
    const { current, hideTextValue, noDefault } = this.props;

    if (!current && noDefault) {
      return {
        label: 'No datasources found',
      };
    }

    const ds = this.dataSourceSrv.getInstanceSettings(current!);

    if (ds) {
      return {
        label: ds.name.substr(0, 37),
        value: ds.name,
        imgUrl: ds.meta.info.logos.small,
        hideText: hideTextValue,
        meta: ds.meta,
      };
    }

    return {
      label: (current ?? 'no name') + ' - not found',
      value: (current ?? 'no name') + ' - not found',
      imgUrl: '',
      hideText: hideTextValue,
    };
  }

  getDataSourceOptions(): Array<SelectableValue<string>> {
    const options: Array<SelectableValue<string>> = this.dataSourceSrv.getList().map((ds) => ({
      value: ds.uid,
      label: ds.name,
      imgUrl: ds.meta.info.logos.small,
      meta: ds.meta,
    }));

    return options;
  }

  render() {
    const { autoFocus, onBlur, openMenuOnFocus, placeholder } = this.props;
    const { error } = this.state;
    const options = this.getDataSourceOptions();
    const value = this.getCurrentValue();

    return (
      <div aria-label={selectors.components.DataSourcePicker.container}>
        <Select
          className="ds-picker select-container"
          isMulti={false}
          isClearable={false}
          backspaceRemovesValue={false}
          onChange={this.onChange}
          options={options}
          autoFocus={autoFocus}
          onBlur={onBlur}
          openMenuOnFocus={openMenuOnFocus}
          maxMenuHeight={500}
          placeholder={placeholder}
          noOptionsMessage="No datasources found"
          value={value}
          invalid={!!error}
          getOptionLabel={(o) => {
            if (o.meta && isUnsignedPluginSignature(o.meta.signature) && o !== value) {
              return (
                <HorizontalGroup align="center" justify="space-between">
                  <span>{o.label}</span> <PluginSignatureBadge status={o.meta.signature} />
                </HorizontalGroup>
              );
            }
            return o.label || '';
          }}
        />
      </div>
    );
  }
}
