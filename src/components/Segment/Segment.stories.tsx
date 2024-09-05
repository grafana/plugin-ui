import { InfoBox } from '@grafana/ui';
import React from 'react';
import { Segment } from './Segment';
import { SelectableValue } from '@grafana/data';

export default {
  title: 'Forms/Segment',
  component: Segment,
};

export const basic = () => {
  const [value, setValue] = React.useState('');
  const options: Array<SelectableValue<string>> = [{
    label: "Option 1",
    value: "option1",
  }, {
    label: "Option 2",
    value: "option2",
  }]

  return (
    <>
      <InfoBox title='Updated value'>{`"${value}"`}</InfoBox>
      <Segment
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
      <Segment
        options={options}
        placeholder='Type something here'
        value={value}
        onDebounce={(newValue) => setValue(newValue!)}
        delay={delay}
      />
    </>
  );
};
