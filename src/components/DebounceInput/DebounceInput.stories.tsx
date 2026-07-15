import { Alert } from '@grafana/ui';
import React from 'react';
import { DebounceInput } from './DebounceInput';

export default {
  title: 'Forms/DebounceInput',
  component: DebounceInput,
};

export const Basic = () => {
  const [value, setValue] = React.useState('');

  return (
    <>
      <Alert title="Updated value" severity="info">{`"${value}"`}</Alert>
      <DebounceInput placeholder="Type something here" value={value} onDebounce={(newValue) => setValue(newValue!)} />
    </>
  );
};

export const CustomDelay = () => {
  const [value, setValue] = React.useState('');
  const delay = 1000;

  return (
    <>
      <Alert title={`Updated value with custom delay of ${delay}`} severity="info">{`"${value}"`}</Alert>
      <DebounceInput
        placeholder="Type something here"
        value={value}
        onDebounce={(newValue) => setValue(newValue!)}
        delay={delay}
      />
    </>
  );
};
