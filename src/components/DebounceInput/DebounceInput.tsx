import React, { ComponentProps } from 'react';
import { Input } from '@grafana/ui';
import { useDebounce } from '../../hooks/useDebounce';

export interface DebounceInputProps extends Omit<ComponentProps<typeof Input>, 'ref'> {
  value: string;
  onDebounce: (debouncedInput?: string) => void;
  delay?: number;
}

export const DebounceInput = (props: DebounceInputProps) => {
  const { delay, onDebounce, value, ...rest } = props;
  const [input, setInput] = React.useState(value);

  const debouncedInput = useDebounce(input, delay);

  // TODO: We should fix this
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => onDebounce(debouncedInput), [debouncedInput]);
  React.useEffect(() => setInput(value), [value]);

  return <Input onChange={(ev) => setInput(ev.currentTarget.value)} value={input} {...rest} />;
};
