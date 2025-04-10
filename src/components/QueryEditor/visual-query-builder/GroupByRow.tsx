import React, { useCallback } from 'react';

import { type SelectableValue, toOption } from '@grafana/data';
import { type SQLExpression } from '../types';
import { type QueryEditorGroupByExpression } from '../expressions';
import { setGroupByField } from '../utils/sql.utils';
import { EditorList } from '../EditorList';
import { Select } from '@grafana/ui';
import { AccessoryButton } from '../AccessoryButton';
import { InputGroup } from '../InputGroup';

interface GroupByRowProps {
  sql: SQLExpression;
  onSqlChange: (sql: SQLExpression) => void;
  columns?: Array<SelectableValue<string>>;
}

export function GroupByRow({ sql, columns, onSqlChange }: GroupByRowProps) {
  const onGroupByChange = useCallback(
    (item: Array<Partial<QueryEditorGroupByExpression>>) => {
      // As new (empty object) items come in, we need to make sure they have the correct type
      const cleaned = item.map((v) => setGroupByField(v.property?.name));
      const newSql = { ...sql, groupBy: cleaned };
      onSqlChange(newSql);
    },
    [onSqlChange, sql]
  );

  return (
    <EditorList
      items={sql.groupBy!}
      onChange={onGroupByChange}
      renderItem={makeRenderColumn({
        options: columns,
      })}
    />
  );
}

function makeRenderColumn({ options }: { options?: Array<SelectableValue<string>> }) {
  const renderColumn = function (
    item: Partial<QueryEditorGroupByExpression>,
    onChangeItem: (item: QueryEditorGroupByExpression) => void,
    onDeleteItem: () => void
  ) {
    return (
      <InputGroup>
        <Select
          value={item.property?.name ? toOption(item.property.name) : null}
          aria-label="Group by"
          options={options}
          menuShouldPortal
          onChange={({ value }) => value && onChangeItem(setGroupByField(value))}
        />
        <AccessoryButton aria-label="Remove group by column" icon="times" variant="secondary" onClick={onDeleteItem} />
      </InputGroup>
    );
  };
  return renderColumn;
}
