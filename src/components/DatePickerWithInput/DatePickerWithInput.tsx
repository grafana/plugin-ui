import { Input } from '@grafana/ui';
import React, { ComponentProps } from 'react';
import { DatePicker } from '../DatePicker/DatePicker';
import './style.css';

export const formatDate = (date: Date) => date.toISOString().split('T')[0];

export interface DatePickerWithInputProps
  extends Omit<ComponentProps<typeof Input>, 'ref' | 'value' | 'onChange'> {
  value?: Date;
  onChange: (value: Date) => void;
}

export const DatePickerWithInput = (props: DatePickerWithInputProps) => {
  const { value, onChange, className, ...rest } = props;
  const [open, setOpen] = React.useState(false);

  let inputClassName = 'grafana-plugin-ui-date-input'
  if (className) {
    inputClassName += ` ${className}`;
  }

  return (
    <>
      <Input
        type='date'
        placeholder='Date'
        value={formatDate(value || new Date())}
        onClick={() => setOpen(true)}
        onChange={() => {}}
        className={inputClassName}
        {...rest}
      />
      <DatePicker
        isOpen={open}
        value={value}
        onChange={(ev: any) => onChange(ev)}
        onClose={() => setOpen(false)}
      />
    </>
  );
};
