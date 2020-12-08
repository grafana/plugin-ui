import React from 'react';
import { DatePicker } from './DatePicker';
import { ClickOutsideWrapper, Input } from '@grafana/ui';

export default {
  title: 'Pickers And Editors/DatePicker',
  component: DatePicker,
};

const formatDate = (date: Date) => date.toISOString().split('T')[0];

export const basic = () => {
  const [date, setDate] = React.useState<Date>(new Date());
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Input
        type='date'
        width={40}
        placeholder='Date'
        css={null}
        value={formatDate(date)}
        onClick={() => setOpen(true)}
        onChange={() => {}}
      />
      <ClickOutsideWrapper
        useCapture={true}
        includeButtonPress={false}
        onClick={() => setOpen(false)}
      >
        <DatePicker
          isOpen={open}
          value={date}
          onChange={(newDate) => setDate(newDate)}
        />
      </ClickOutsideWrapper>
    </>
  );
};
