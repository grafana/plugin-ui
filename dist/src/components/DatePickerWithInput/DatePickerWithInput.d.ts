/// <reference types="react" />
import { Props as InputProps } from '@grafana/ui/components/Input/Input';
import './style.css';
export declare const formatDate: (date: Date) => string;
export interface DatePickerWithInputProps extends Omit<InputProps, 'ref' | 'value' | 'onChange'> {
    value?: Date;
    onChange: (value: Date) => void;
}
export declare const DatePickerWithInput: (props: DatePickerWithInputProps) => JSX.Element;
