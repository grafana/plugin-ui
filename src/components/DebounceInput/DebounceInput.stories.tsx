import React from 'react';
import DebounceInput from './DebounceInput';
import { Chance } from 'chance';

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
