/// <reference types="react" />
import { SelectCommonProps } from '@grafana/ui';
interface InlineSelectProps<T> extends SelectCommonProps<T> {
    label?: string;
}
export declare function InlineSelect<T>({ label: labelProp, ...props }: InlineSelectProps<T>): JSX.Element;
export {};
