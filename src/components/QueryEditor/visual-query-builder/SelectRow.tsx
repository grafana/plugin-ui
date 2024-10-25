import { css } from '@emotion/css';
import { uniqueId } from 'lodash';
import React, { useCallback } from 'react';

import { SelectableValue, toOption } from '@grafana/data';
import { Button, Select, useStyles2 } from '@grafana/ui';
import { EditorField } from '../EditorField';
import { QueryEditorFunctionExpression, QueryEditorExpressionType } from '../expressions';
import { SQLExpression } from '../types';
import { createFunctionField } from '../utils/sql.utils';
import { EditorStack } from '../EditorStack';

interface SelectRowProps {
  sql: SQLExpression;
  onSqlChange: (sql: SQLExpression) => void;
  columns?: Array<SelectableValue<string>>;
  functions?: Array<SelectableValue<string>>;
}

const asteriskValue = { label: '*', value: '*' };

export function SelectRow({ sql, columns, onSqlChange, functions }: SelectRowProps) {
  const styles = useStyles2(getStyles);
  const columnsWithAsterisk = [asteriskValue, ...(columns || [])];

  const onColumnChange = useCallback(
    (item: QueryEditorFunctionExpression, index: number) => (column: SelectableValue<string>) => {
      let modifiedItem = { ...item };
      if (!item.parameters?.length) {
        modifiedItem.parameters = [{ type: QueryEditorExpressionType.FunctionParameter, name: column.value } as const];
      } else {
        modifiedItem.parameters = item.parameters.map((p) =>
          p.type === QueryEditorExpressionType.FunctionParameter ? { ...p, name: column.value } : p
        );
      }

      const newSql: SQLExpression = {
        ...sql,
        columns: sql.columns?.map((c, i) => (i === index ? modifiedItem : c)),
      };

      onSqlChange(newSql);
    },
    [onSqlChange, sql]
  );

  const onAggregationChange = useCallback(
    (item: QueryEditorFunctionExpression, index: number) => (aggregation: SelectableValue<string>) => {
      const newItem = {
        ...item,
        name: aggregation?.value,
      };
      const newSql: SQLExpression = {
        ...sql,
        columns: sql.columns?.map((c, i) => (i === index ? newItem : c)),
      };

      onSqlChange(newSql);
    },
    [onSqlChange, sql]
  );

  const removeColumn = useCallback(
    (index: number) => () => {
      const clone = [...sql.columns!];
      clone.splice(index, 1);
      const newSql: SQLExpression = {
        ...sql,
        columns: clone,
      };
      onSqlChange(newSql);
    },
    [onSqlChange, sql]
  );

  const addColumn = useCallback(() => {
    const newSql: SQLExpression = { ...sql, columns: [...sql.columns!, createFunctionField()] };
    onSqlChange(newSql);
  }, [onSqlChange, sql]);

  return (
    <EditorStack gap={2} alignItems="end" direction="column">
      {sql.columns?.map((item, index) => (
        <div key={index}>
          <EditorStack gap={2} alignItems="end">
            <EditorField label="Column" width={25}>
              <Select
                value={getColumnValue(item)}
                options={columnsWithAsterisk}
                inputId={`select-column-${index}-${uniqueId()}`}
                menuShouldPortal
                allowCustomValue
                onChange={onColumnChange(item, index)}
              />
            </EditorField>

            <EditorField label="Aggregation" optional width={25}>
              <Select
                value={item.name ? toOption(item.name) : null}
                inputId={`select-aggregation-${index}-${uniqueId()}`}
                isClearable
                menuShouldPortal
                allowCustomValue
                options={functions}
                onChange={onAggregationChange(item, index)}
              />
            </EditorField>
            <Button
              aria-label="Remove"
              type="button"
              icon="trash-alt"
              variant="secondary"
              size="md"
              onClick={removeColumn(index)}
            />
          </EditorStack>
        </div>
      ))}
      <Button
        type="button"
        onClick={addColumn}
        variant="secondary"
        size="md"
        icon="plus"
        aria-label="Add"
        className={styles.addButton}
      />
    </EditorStack>
  );
}

const getStyles = () => {
  return { addButton: css({ alignSelf: 'flex-start' }) };
};

function getColumnValue({ parameters }: QueryEditorFunctionExpression): SelectableValue<string> | null {
  const column = parameters?.find((p) => p.type === QueryEditorExpressionType.FunctionParameter);
  if (column?.name) {
    return toOption(column.name);
  }
  return null;
}
