import React from 'react';
import { DatePickerWithInput } from './DatePickerWithInput';

export default {
  title: 'Forms/DatePickerWithInput',
  component: DatePickerWithInput,
};

export const basic = () => {
  const [date, setDate] = React.useState<Date>(new Date());

  return (
    <DatePickerWithInput
      width={40}
      value={date}
      onChange={(newDate) => setDate(newDate)}
    />
  );
};
