import { css } from '@emotion/css';
import React, { useState } from 'react';
import { DraggableProvided } from '@hello-pangea/dnd';

import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Select, useStyles2 } from '@grafana/ui';

import { OperationInfoButton } from './OperationInfoButton';

import { VisualQueryModeller, QueryBuilderOperation, QueryBuilderOperationDefinition } from '../types';
import { FlexItem } from '../../QueryEditor/FlexItem';

interface Props {
  operation: QueryBuilderOperation;
  definition: QueryBuilderOperationDefinition;
  index: number;
  queryModeller: VisualQueryModeller;
  dragHandleProps?: DraggableProvided['dragHandleProps'];
  onChange: (index: number, update: QueryBuilderOperation) => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
}

interface State {
  isOpen?: boolean;
  disabled?: boolean;
  alternatives?: Array<SelectableValue<QueryBuilderOperationDefinition>>;
}

export const OperationHeader = React.memo<Props>(
  ({ operation, definition, index, onChange, onRemove, onToggle, queryModeller, dragHandleProps }) => {
    const styles = useStyles2(getStyles);
    const [state, setState] = useState<State>({});

    const onToggleSwitcher = () => {
      if (state.isOpen) {
        setState({ ...state, isOpen: false });
      } else {
        const alternatives = queryModeller
          .getAlternativeOperations(definition.alternativesKey!)
          .map((alt) => ({ label: alt.name, value: alt }));
        setState({ isOpen: true, alternatives });
      }
    };

    return (
      <div className={styles.header}>
        {!state.isOpen && (
          <>
            <div {...dragHandleProps}>{definition.name ?? definition.id}</div>
            <FlexItem grow={1} />
            <div className={`${styles.operationHeaderButtons} operation-header-show-on-hover`}>
              <Button
                icon="angle-down"
                size="sm"
                onClick={onToggleSwitcher}
                fill="text"
                variant="secondary"
                title="Click to view alternative operations"
              />
              <OperationInfoButton definition={definition} operation={operation} innerQueryPlaceholder={queryModeller.innerQueryPlaceholder} />
              {definition.toggleable && (
                <Button
                  icon={operation.disabled ? "eye-slash" : "eye"}
                  size="sm"
                  onClick={() => onToggle(index)}
                  fill="text"
                  variant="secondary"
                  title={operation.disabled ? "Enable operation" : "Disable operation"}
                />
              )}
              <Button
                icon="times"
                size="sm"
                onClick={() => onRemove(index)}
                fill="text"
                variant="secondary"
                title="Remove operation"
              />
            </div>
          </>
        )}
        {state.isOpen && (
          <div className={styles.selectWrapper}>
            <Select
              autoFocus
              openMenuOnFocus
              placeholder="Replace with"
              options={state.alternatives}
              isOpen={true}
              onCloseMenu={onToggleSwitcher}
              onChange={(value) => {
                if (value.value) {
                  // Operation should exist if it is selectable
                  const newDef = queryModeller.getOperationDefinition(value.value.id)!;

                  // copy default params, and override with all current params
                  const newParams = [...newDef.defaultParams];
                  for (let i = 0; i < Math.min(operation.params.length, newParams.length); i++) {
                    if (newDef.params[i].type === definition.params[i].type) {
                      newParams[i] = operation.params[i];
                    }
                  }

                  const changedOp = { ...operation, params: newParams, id: value.value.id };
                  onChange(index, definition.changeTypeHandler ? definition.changeTypeHandler(changedOp, newDef) : changedOp);
                }
              }}
            />
          </div>
        )}
      </div>
    );
  }
);

OperationHeader.displayName = 'OperationHeader';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    header: css({
      borderBottom: `1px solid ${theme.colors.border.medium}`,
      padding: theme.spacing(0.5, 0.5, 0.5, 1),
      display: 'flex',
      alignItems: 'center',
    }),
    operationHeaderButtons: css({
      opacity: 1,
    }),
    selectWrapper: css({
      paddingRight: theme.spacing(2),
    }),
  };
};
