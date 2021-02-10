import React, { useEffect } from 'react';
import { Segment as GrafanaSegment } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { SegmentSyncProps as GrafanaSegmentProps } from '@grafana/ui/components/Segment/Segment';
import { useDebounce } from '../../hooks/useDebounce';

export interface SegmentProps<T> extends Omit<GrafanaSegmentProps<T>, 'onChange'> {
  value: T;
  onDebounce: (debouncedSegment?: T) => void;
  delay?: number;
}

export function Segment<T> (props: SegmentProps<T>) {
  const { delay, onDebounce, value, options, ...rest } = props;
  const [input, setInput] = React.useState(value);

  const debouncedSegment = useDebounce(input, delay);

  useEffect(() => onDebounce(debouncedSegment), [debouncedSegment]);
  useEffect(() => setInput(value), [value]);

  return (
    <GrafanaSegment
      options={options}
      onChange={(ev: SelectableValue<T>) => setInput(ev.value!)}
      value={input}
      {...rest}
    />
  );
};
