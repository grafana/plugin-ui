import React from 'react';
import { DatePicker } from './DatePicker';
import { Button } from '@grafana/ui';

export default {
  title: 'Pickers And Editors/DatePicker',
  component: DatePicker,
};

export const Basic = () => {
  const [date, setDate] = React.useState<Date>(new Date());
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Show Calendar</Button>
      <DatePicker isOpen={open} value={date} onChange={(newDate) => setDate(newDate)} onClose={() => setOpen(false)} />
    </>
  );
};
