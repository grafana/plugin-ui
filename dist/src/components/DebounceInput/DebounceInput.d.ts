/// <reference types="react" />
import { Props as InputProps } from '@grafana/ui/components/Input/Input';
export interface DebounceInputProps extends Omit<InputProps, 'ref'> {
    value: string;
    onDebounce: (debouncedInput?: string) => void;
    delay?: number;
}
export declare const DebounceInput: (props: DebounceInputProps) => JSX.Element;
