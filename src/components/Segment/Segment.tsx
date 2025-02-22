import React, { useEffect, type ComponentProps } from 'react';
import { Segment as GrafanaSegment } from '@grafana/ui';
import { type SelectableValue } from '@grafana/data';
import { useDebounce } from '../../hooks/useDebounce';

export interface SegmentProps<T> extends Omit<ComponentProps<typeof GrafanaSegment<T>>, 'onChange'> {
  value: T;
  onDebounce: (debouncedSegment?: T) => void;
  delay?: number;
}

export function Segment<T>(props: SegmentProps<T>) {
  const { delay, onDebounce, value, options, ...rest } = props;
  const [input, setInput] = React.useState(value);

  const debouncedSegment = useDebounce(input, delay);

  // TODO: We should fix the exhaustive-deps rule
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
}
