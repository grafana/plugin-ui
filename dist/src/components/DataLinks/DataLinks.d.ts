/// <reference types="react" />
import { DataLinkConfig } from './types';
declare type Props = {
    value?: DataLinkConfig[];
    onChange: (value: DataLinkConfig[]) => void;
};
export declare const DataLinks: (props: Props) => JSX.Element;
export {};
