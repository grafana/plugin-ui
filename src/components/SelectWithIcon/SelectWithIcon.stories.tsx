import React from 'react';
import { SelectWithIcon } from './SelectWithIcon';
import { generateOptions } from '../../__fixtures__/Select';
import { Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';

export default {
  title: 'Forms/SelectWithIcon',
  component: SelectWithIcon,
};

export const basic = () => {
  const [value, setValue] = React.useState<string>();

  return (
    <SelectWithIcon
      width={40}
      displayIcon={!value}
      options={generateOptions()}
      value={value}
      onChange={(ev) => setValue(ev.value)}
    />
  );
};

export const multi = () => {
  const [value, setValue] = React.useState([]);
  const [options, setOptions] = React.useState<Array<SelectableValue<string>>>(
    []
  );

  React.useEffect(() => setOptions(generateOptions()), []);

  return (
    <SelectWithIcon
      isMulti={true}
      width={40}
      displayIcon={value.length === 0}
      options={options}
      value={value}
      onChange={(ev) =>
        setValue(ev.map((e: SelectableValue<string>) => e.value!))
      }
      maxVisibleValues={3}
    />
  );
};

export const withRemoveOption = () => {
  const [value, setValue] = React.useState<string>();

  return (
    <SelectWithIcon
      width={40}
      displayIcon={!value}
      options={generateOptions()}
      value={value}
      onChange={(ev) => setValue(ev.value)}
      renderRemove={Boolean(value)}
      onRemove={() => setValue('')}
    />
  );
};

export const withChildren = () => {
  const [value, setValue] = React.useState<string>();

  return (
    <SelectWithIcon
      width={40}
      displayIcon={!value}
      options={generateOptions()}
      value={value}
      onChange={(ev) => setValue(ev.value)}
      renderRemove={Boolean(value)}
      onRemove={() => setValue('')}
    >
      {value && <Input css={null} width={40} />}
    </SelectWithIcon>
  );
};
