import { InfoBox } from '@grafana/ui';
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
      <InfoBox title='Updated value'>{`"${value}"`}</InfoBox>
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
      <InfoBox title={`Updated value with custom delay of ${delay}`}>
        {`"${value}"`}
      </InfoBox>
      <DebounceInput
        placeholder='Type something here'
        value={value}
        onDebounce={(newValue) => setValue(newValue!)}
        delay={delay}
      />
    </>
  );
};
