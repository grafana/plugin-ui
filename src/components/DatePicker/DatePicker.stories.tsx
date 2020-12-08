import React from 'react';
import { DatePicker } from './DatePicker';
import { Button, ClickOutsideWrapper } from '@grafana/ui';

export default {
  title: 'Pickers And Editors/DatePicker',
  component: DatePicker,
};

export const basic = () => {
  const [date, setDate] = React.useState<Date>(new Date());
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Calendar</Button>
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
