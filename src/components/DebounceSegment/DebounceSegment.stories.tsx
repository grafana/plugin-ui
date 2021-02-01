import { InfoBox } from '@grafana/ui';
import React from 'react';
import { DebounceSegment } from './DebounceSegment';
import { SelectableValue } from '@grafana/data';

export default {
  title: 'Forms/DebounceSegment',
  component: DebounceSegment,
};

export const basic = () => {
  const [value, setValue] = React.useState('');
  const options: SelectableValue<string>[] = [{
    label: "Option 1",
    value: "option1",
  }, {
    label: "Option 2",
    value: "option2",
  }]

  return (
    <>
      <InfoBox title='Updated value'>{`"${value}"`}</InfoBox>
      <DebounceSegment
        options={options}
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
  const options = [{
    label: "Option 1",
    value: "option1",
  }, {
    label: "Option 2",
    value: "option2",
  }]

  return (
    <>
      <InfoBox title={`Updated value with custom delay of ${delay}`}>
        {`"${value}"`}
      </InfoBox>
      <DebounceSegment
        options={options}
        placeholder='Type something here'
        value={value}
        onDebounce={(newValue) => setValue(newValue!)}
        delay={delay}
      />
    </>
  );
};
