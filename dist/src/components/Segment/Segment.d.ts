/// <reference types="react" />
import { SegmentSyncProps as GrafanaSegmentProps } from '@grafana/ui/components/Segment/Segment';
export interface SegmentProps<T> extends Omit<GrafanaSegmentProps<T>, 'onChange'> {
    value: T;
    onDebounce: (debouncedSegment?: T) => void;
    delay?: number;
}
export declare function Segment<T>(props: SegmentProps<T>): JSX.Element;
