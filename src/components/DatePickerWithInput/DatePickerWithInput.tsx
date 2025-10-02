import { Input } from '@grafana/ui';

import { type ComponentProps, useState } from 'react';
import { DatePicker } from '../DatePicker/DatePicker';
import { getStyles } from './styles';
import { cx } from '@emotion/css';

export const formatDate = (date: Date) => date.toISOString().split('T')[0];

export interface DatePickerWithInputProps extends Omit<ComponentProps<typeof Input>, 'ref' | 'value' | 'onChange'> {
  value?: Date;
  onChange: (value: Date) => void;
}

export const DatePickerWithInput = (props: DatePickerWithInputProps) => {
  const { value, onChange, className, ...rest } = props;
  const [open, setOpen] = useState(false);
  const styles = getStyles();

  return (
    <>
      <Input
        type="date"
        placeholder="Date"
        value={formatDate(value || new Date())}
        onClick={() => setOpen(true)}
        onChange={() => {}}
        className={cx(styles.input, className)}
        {...rest}
      />
      <DatePicker isOpen={open} value={value} onChange={(ev: any) => onChange(ev)} onClose={() => setOpen(false)} />
    </>
  );
};
