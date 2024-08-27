import React from 'react';
import { Button, IconName, PopoverContent, Tooltip } from '@grafana/ui';

type RunQueryButtonProps = {
  ariaLabel?: string;
  queryInvalid?: boolean;
  invalidQueryTooltip?: PopoverContent;
  disabled?: boolean;
  queryRunning?: boolean;
  onClick: () => void;
  dataTestId?: string;
};

export const RunQueryButton = ({
  ariaLabel = 'Query editor Run button',
  queryRunning = false,
  queryInvalid = false,
  invalidQueryTooltip,
  disabled = false,
  onClick,
  dataTestId,
}: RunQueryButtonProps) => {
  let icon: IconName | undefined = queryInvalid ? 'exclamation-triangle' : undefined;
  if (queryRunning) {
    icon = 'fa fa-spinner';
  }

  const RunButton = (
    <Button
      aria-label={ariaLabel}
      size="sm"
      variant="secondary"
      icon={icon}
      disabled={disabled || queryRunning}
      onClick={onClick}
      data-testid={dataTestId}
    >
      Run query
    </Button>
  );

  return queryInvalid ? (
    <Tooltip
      theme="error"
      placement="top"
      content={
        invalidQueryTooltip ?? (
          <>
            Your query is invalid. Check below for details. <br />
            However, you can still run this query.
          </>
        )
      }
    >
      {RunButton}
    </Tooltip>
  ) : (
    RunButton
  );
};
