/// <reference types="react" />
import { VariableSuggestion, DataSourceInstanceSettings, DataSourceJsonData } from '@grafana/data';
import { DataLinkConfig } from './types';
declare type Props = {
    value: DataLinkConfig;
    datasources?: DataSourceInstanceSettings<DataSourceJsonData>[];
    onChange: (value: DataLinkConfig) => void;
    onDelete: () => void;
    suggestions: VariableSuggestion[];
    className?: string;
};
export declare const DataLink: (props: Props) => JSX.Element;
export {};
