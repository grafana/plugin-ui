import React from 'react';
import { Input } from '@grafana/ui';
import { Props as InputProps } from '@grafana/ui/components/Input/Input';
import { useDebounce } from '../../hooks/useDebounce';

export interface DebounceInputProps extends Omit<InputProps, 'ref'> {
  value: string;
  onDebounce: (debouncedInput?: string) => void;
  delay?: number;
}

const DebounceInput = (props: DebounceInputProps) => {
  const { delay, onDebounce, value, ...rest } = props;
  const [input, setInput] = React.useState(value);

  const debouncedInput = useDebounce(input, delay);

  React.useEffect(() => onDebounce(debouncedInput), [debouncedInput]);
  React.useEffect(() => setInput(value), [value]);

  return (
    <Input
      css={null}
      onChange={(ev) => setInput(ev.currentTarget.value)}
      value={input}
      {...rest}
    />
  );
};

export default DebounceInput;
