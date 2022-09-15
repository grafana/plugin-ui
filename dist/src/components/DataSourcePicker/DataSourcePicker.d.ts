import { PureComponent } from 'react';
import { DataSourceInstanceSettings, SelectableValue } from '@grafana/data';
import { DataSourceSrv } from '@grafana/runtime';
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
export declare class DataSourcePicker extends PureComponent<Props, State> {
    dataSourceSrv: DataSourceSrv;
    static defaultProps: Partial<Props>;
    state: State;
    constructor(props: Props);
    componentDidMount(): void;
    onChange: (item: SelectableValue<string>) => void;
    private getCurrentValue;
    getDataSourceOptions(): Array<SelectableValue<string>>;
    render(): JSX.Element;
}
