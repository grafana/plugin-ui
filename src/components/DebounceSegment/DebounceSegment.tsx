import React from 'react';
import { Segment } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { SegmentSyncProps as SegmentProps } from '@grafana/ui/components/Segment/Segment';
import { useDebounce } from '../../hooks/useDebounce';

export interface DebounceSegmentProps<T> extends Omit<SegmentProps<T>, 'onChange'> {
  value: T;
  onDebounce: (debouncedSegment?: T) => void;
  delay?: number;
}

export function DebounceSegment<T> (props: DebounceSegmentProps<T>) {
  const { delay, onDebounce, value, options, ...rest } = props;
  const [input, setInput] = React.useState(value);

  const debouncedSegment = useDebounce(input, delay);

  React.useEffect(() => onDebounce(debouncedSegment), [debouncedSegment]);
  React.useEffect(() => setInput(value), [value]);

  return (
    <Segment
      options={options}
      onChange={(ev: SelectableValue<T>) => setInput(ev.value!)}
      value={input}
      {...rest}
    />
  );
};
