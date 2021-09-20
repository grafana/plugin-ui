import { Input } from '@grafana/ui';
import React from 'react';
import { DatePicker } from '../DatePicker/DatePicker';
import { Props as InputProps } from '@grafana/ui/components/Input/Input';
import './style.css';

export const formatDate = (date: Date) => date.toISOString().split('T')[0];

export interface DatePickerWithInputProps
  extends Omit<InputProps, 'ref' | 'value' | 'onChange'> {
  value?: Date;
  onChange: (value: Date) => void;
}

export const DatePickerWithInput = (props: DatePickerWithInputProps) => {
  const { value, onChange, ...rest } = props;

  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Input
        type='date'
        placeholder='Date'
        value={formatDate(value || new Date())}
        onClick={() => setOpen(true)}
        onChange={() => {}}
        {...rest}
      />
      <DatePicker
        isOpen={open}
        value={value}
        onChange={(ev) => onChange(ev)}
        onClose={() => setOpen(false)}
      />
    </>
  );
};
