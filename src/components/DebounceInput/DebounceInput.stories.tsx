import React from 'react';
import { DebounceInput } from './DebounceInput';

export default {
  title: 'Layout/DebounceInput',
  component: DebounceInput,
};

export const basic = () => {
  const [value, setValue] = React.useState('');

  return (
    <>
      <span>{`Updated value is: "${value}"`}</span>
      <DebounceInput
        placeholder='Type something here'
        value={value}
        onDebounce={(newValue) => setValue(newValue!)}
      />
    </>
  );
};

export const customDelay = () => {
  const [value, setValue] = React.useState('');
  const delay = 1000;

  return (
    <>
      <span>{`Using a custom delay of ${delay}, updated value is: "${value}"`}</span>
      <DebounceInput
        placeholder='Type something here'
        value={value}
        onDebounce={(newValue) => setValue(newValue!)}
        delay={delay}
      />
    </>
  );
};
