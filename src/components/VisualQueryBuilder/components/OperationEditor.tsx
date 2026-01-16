import { css, cx } from '@emotion/css';
import React from 'react';
import { Draggable } from '@hello-pangea/dnd';

import { type DataSourceApi, type GrafanaTheme2, type TimeRange } from '@grafana/data';
import { InlineField, useTheme2 } from '@grafana/ui';

import { type QueryBuilderOperation, type VisualQuery, type VisualQueryModeller } from '../types';
import { OperationEditorBody } from './OperationEditorBody';

interface Props<T extends VisualQuery> {
  operation: QueryBuilderOperation;
  index: number;
  query: T;
  datasource: DataSourceApi;
  queryModeller: VisualQueryModeller;
  onChange: (index: number, update: QueryBuilderOperation) => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
  onRunQuery: () => void;
  flash?: boolean;
  highlight?: boolean;
  timeRange?: TimeRange;
  isConflictingOperation?: (operation: QueryBuilderOperation, otherOperations: QueryBuilderOperation[]) => boolean;
}

export function OperationEditor<T extends VisualQuery>({
  operation,
  index,
  onRemove,
  onToggle,
  onChange,
  onRunQuery,
  queryModeller,
  query,
  datasource,
  flash,
  highlight,
  timeRange,
  isConflictingOperation,
}: Props<T>) {
  const def = queryModeller.getOperationDefinition(operation.id);

  const theme = useTheme2();
  const isConflicting = isConflictingOperation ? isConflictingOperation(operation, query.operations) : false;
  const styles = getStyles(theme, isConflicting);

  if (!def) {
    return <span>Operation {operation.id} not found</span>;
  }

  const isInvalid = (isDragging: boolean) => {
    if (isDragging) {
      return undefined;
    }

    return isConflicting ? true : undefined;
  };

  return (
    <Draggable draggableId={`operation-${index}`} index={index}>
      {(provided, snapshot) => (
        <InlineField
          error={'You have conflicting label filters'}
          invalid={isInvalid(snapshot.isDragging)}
          className={cx(styles.error, styles.cardWrapper)}
        >
          <OperationEditorBody
            provided={provided}
            flash={flash}
            highlight={highlight}
            isConflicting={isConflicting}
            index={index}
            operation={operation}
            definition={def}
            onChange={onChange}
            onRemove={onRemove}
            onToggle={onToggle}
            queryModeller={queryModeller}
            query={query}
            timeRange={timeRange}
            onRunQuery={onRunQuery}
            datasource={datasource}
          />
        </InlineField>
      )}
    </Draggable>
  );
}

const getStyles = (theme: GrafanaTheme2, isConflicting: boolean) => {
  return {
    cardWrapper: css({
      alignItems: 'stretch',
    }),
    error: css({
      marginBottom: theme.spacing(1),
    }),
  };
};
