import React, { useState } from 'react';
import { Button } from '@grafana/ui';
import { type DataQuery, LoadingState } from '@grafana/data';

export interface RunQueryButtonsProps<TQuery extends DataQuery> {
  enableRun?: boolean;
  onRunQuery: () => void;
  onCancelQuery: (query: TQuery) => void;
  query: TQuery;
  state?: LoadingState;
}

export const RunQueryButtons = <TQuery extends DataQuery>(props: RunQueryButtonsProps<TQuery>) => {
  const { state } = props;
  const [running, setRunning] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [prevState, setPrevState] = useState(state);
  const [lastQuery, setLastQuery] = useState(props.query);

  if (state !== prevState) {
    setPrevState(state);
    if (state && state !== LoadingState.Loading) {
      setRunning(false);
      setStopping(false);
    }
  }

  const onRunQuery = () => {
    setRunning(true);
    setLastQuery(props.query);
    props.onRunQuery();
  };

  const onCancelQuery = props.onCancelQuery
    ? () => {
        props.onCancelQuery?.(lastQuery);
        setStopping(true);
      }
    : undefined;

  return (
    <>
      <Button
        variant={props.enableRun ? 'primary' : 'secondary'}
        size="sm"
        onClick={onRunQuery}
        icon={running && !stopping ? 'fa fa-spinner' : undefined}
        disabled={state === LoadingState.Loading || !props.enableRun}
      >
        Run query
      </Button>
      <Button
        variant={running && !stopping ? 'primary' : 'secondary'}
        size="sm"
        disabled={!running || stopping}
        icon={stopping ? 'fa fa-spinner' : undefined}
        onClick={onCancelQuery}
      >
        Stop query
      </Button>
    </>
  );
};
