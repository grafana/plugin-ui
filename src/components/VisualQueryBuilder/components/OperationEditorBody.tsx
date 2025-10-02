import { useEffect, useRef, useState } from 'react';
import { type DraggableProvided } from '@hello-pangea/dnd';
import { Button, Icon, Tooltip, useTheme2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { type DataSourceApi, type GrafanaTheme2, type TimeRange } from '@grafana/data';
import { OperationHeader } from './OperationHeader';
import {
  type QueryBuilderOperation,
  type QueryBuilderOperationDefinition,
  type QueryBuilderOperationParamDef,
  type QueryBuilderOperationParamValue,
  type VisualQuery,
  type VisualQueryModeller,
} from '../types';
import { getOperationParamEditor, getOperationParamId } from './OperationParamEditor';
import { v4 } from 'uuid';
import { EditorStack } from '../../QueryEditor';

type Props = {
  provided: DraggableProvided;
  isConflicting: boolean;
  index: number;
  operation: QueryBuilderOperation;
  definition: QueryBuilderOperationDefinition;
  queryModeller: VisualQueryModeller;
  query: VisualQuery;
  onChange: (index: number, update: QueryBuilderOperation) => void;
  onRemove: (index: number) => void;
  onToggle: (index: number) => void;
  onRunQuery: () => void;
  datasource: DataSourceApi;
  flash?: boolean;
  highlight?: boolean;
  timeRange?: TimeRange;
};

export function OperationEditorBody({
  provided,
  flash,
  isConflicting,
  highlight,
  index,
  queryModeller,
  onChange,
  onRemove,
  onToggle,
  operation,
  definition,
  query,
  timeRange,
  onRunQuery,
  datasource,
}: Props) {
  const theme = useTheme2();
  const styles = getStyles(theme, isConflicting);
  const shouldFlash = useFlash(flash);
  const { current: id } = useRef(v4());

  const onParamValueChanged = (paramIdx: number, value: QueryBuilderOperationParamValue) => {
    const update: QueryBuilderOperation = { ...operation, params: [...operation.params] };
    update.params[paramIdx] = value;
    callParamChangedThenOnChange(definition, update, index, paramIdx, onChange);
  };

  const onAddRestParam = () => {
    const update: QueryBuilderOperation = { ...operation, params: [...operation.params, ''] };
    callParamChangedThenOnChange(definition, update, index, operation.params.length, onChange);
  };

  const onRemoveRestParam = (paramIdx: number) => {
    const update: QueryBuilderOperation = {
      ...operation,
      params: [...operation.params.slice(0, paramIdx), ...operation.params.slice(paramIdx + 1)],
    };
    callParamChangedThenOnChange(definition, update, index, paramIdx, onChange);
  };

  // Handle adding button for rest params
  let restParam: React.ReactNode | undefined;
  if (definition.params.length > 0) {
    const lastParamDef = definition.params[definition.params.length - 1];
    if (lastParamDef.restParam) {
      restParam = renderAddRestParamButton(lastParamDef, onAddRestParam, index, operation.params.length, styles);
    }
  }

  return (
    <div
      className={cx(styles.card, {
        [styles.cardHighlight]: shouldFlash || highlight,
        [styles.cardError]: isConflicting,
        [styles.disabled]: operation.disabled,
      })}
      ref={provided.innerRef}
      {...provided.draggableProps}
      data-testid={`operations.${index}.wrapper`}
    >
      <OperationHeader
        operation={operation}
        dragHandleProps={provided.dragHandleProps}
        definition={definition}
        index={index}
        onChange={onChange}
        onRemove={onRemove}
        onToggle={onToggle}
        queryModeller={queryModeller}
      />
      <div className={styles.body}>
        {operation.params.map((param, paramIndex) => {
          const paramDef = definition.params[Math.min(definition.params.length - 1, paramIndex)];
          const Editor = getOperationParamEditor(paramDef);

          return (
            <div className={styles.paramRow} key={`${paramIndex}-1`}>
              {!paramDef.hideName && (
                <div className={styles.paramName}>
                  <label htmlFor={getOperationParamId(id, paramIndex)}>{paramDef.name}</label>
                  {paramDef.description && (
                    <Tooltip placement="top" content={paramDef.description} theme="info">
                      <Icon name="info-circle" size="sm" className={styles.infoIcon} />
                    </Tooltip>
                  )}
                </div>
              )}
              <div className={styles.paramValue}>
                <EditorStack gap={0.5} direction="row" alignItems="center" wrap={false}>
                  <Editor
                    index={paramIndex}
                    paramDef={paramDef}
                    value={operation.params[paramIndex]}
                    operation={operation}
                    operationId={id}
                    onChange={onParamValueChanged}
                    onRunQuery={onRunQuery}
                    query={query}
                    datasource={datasource}
                    timeRange={timeRange}
                    queryModeller={queryModeller}
                  />
                  {paramDef.restParam && (operation.params.length > definition.params.length || paramDef.optional) && (
                    <Button
                      data-testid={`operations.${index}.remove-rest-param`}
                      size="sm"
                      fill="text"
                      icon="times"
                      variant="secondary"
                      title={`Remove ${paramDef.name}`}
                      onClick={() => onRemoveRestParam(paramIndex)}
                    />
                  )}
                </EditorStack>
              </div>
            </div>
          );
        })}
      </div>
      {restParam}
      {index < query.operations.length - 1 && (
        <div className={styles.arrow}>
          <div className={styles.arrowLine} />
          <div className={styles.arrowArrow} />
        </div>
      )}
    </div>
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
    card: css({
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.medium}`,
      cursor: 'grab',
      borderRadius: theme.shape.radius.default,
      position: 'relative',
      transition: 'all 0.5s ease-in 0s',
      height: isConflicting ? 'auto' : '100%',
    }),
    disabled: css({
      opacity: 0.5,
      transition: 'none',
    }),
    cardError: css({
      boxShadow: `0px 0px 4px 0px ${theme.colors.warning.main}`,
      border: `1px solid ${theme.colors.warning.main}`,
    }),
    cardHighlight: css({
      boxShadow: `0px 0px 4px 0px ${theme.colors.primary.border}`,
      border: `1px solid ${theme.colors.primary.border}`,
    }),
    infoIcon: css({
      marginLeft: theme.spacing(0.5),
      color: theme.colors.text.secondary,
      ':hover': {
        color: theme.colors.text.primary,
      },
    }),
    body: css({
      margin: theme.spacing(1, 1, 0.5, 1),
      display: 'table',
    }),
    paramRow: css({
      label: 'paramRow',
      display: 'table-row',
      verticalAlign: 'middle',
    }),
    paramName: css({
      display: 'table-cell',
      padding: theme.spacing(0, 1, 0, 0),
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      verticalAlign: 'middle',
      height: '32px',
    }),
    paramValue: css({
      label: 'paramValue',
      display: 'table-cell',
      verticalAlign: 'middle',
    }),
    restParam: css({
      padding: theme.spacing(0, 1, 1, 1),
    }),
    arrow: css({
      position: 'absolute',
      top: '0',
      right: '-18px',
      display: 'flex',
    }),
    arrowLine: css({
      height: '2px',
      width: '8px',
      backgroundColor: theme.colors.border.strong,
      position: 'relative',
      top: '14px',
    }),
    arrowArrow: css({
      width: 0,
      height: 0,
      borderTop: `5px solid transparent`,
      borderBottom: `5px solid transparent`,
      borderLeft: `7px solid ${theme.colors.border.strong}`,
      position: 'relative',
      top: '10px',
    }),
  };
};

/**
 * When flash is switched on makes sure it is switched of right away, so we just flash the highlight and then fade
 * out.
 * @param flash
 */
function useFlash(flash?: boolean) {
  const [keepFlash, setKeepFlash] = useState(true);
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (flash) {
      t = setTimeout(() => {
        setKeepFlash(false);
      }, 1000);
    } else {
      setKeepFlash(true);
    }

    return () => clearTimeout(t);
  }, [flash]);

  return keepFlash && flash;
}

function callParamChangedThenOnChange(
  def: QueryBuilderOperationDefinition,
  operation: QueryBuilderOperation,
  operationIndex: number,
  paramIndex: number,
  onChange: (index: number, update: QueryBuilderOperation) => void
) {
  if (def.paramChangedHandler) {
    onChange(operationIndex, def.paramChangedHandler(paramIndex, operation, def));
  } else {
    onChange(operationIndex, operation);
  }
}

function renderAddRestParamButton(
  paramDef: QueryBuilderOperationParamDef,
  onAddRestParam: () => void,
  operationIndex: number,
  paramIndex: number,
  styles: OperationEditorStyles
) {
  return (
    <div className={styles.restParam} key={`${paramIndex}-2`}>
      <Button
        size="sm"
        icon="plus"
        title={`Add ${paramDef.name}`.trimEnd()}
        variant="secondary"
        onClick={onAddRestParam}
        data-testid={`operations.${operationIndex}.add-rest-param`}
      >
        {paramDef.name}
      </Button>
    </div>
  );
}

type OperationEditorStyles = ReturnType<typeof getStyles>;
