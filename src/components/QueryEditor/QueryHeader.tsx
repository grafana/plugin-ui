import React, { useCallback, useState } from 'react';
import { useCopyToClipboard } from 'react-use';

import { SelectableValue } from '@grafana/data';

import { ConfirmModal } from './ConfirmModal';
import { DatasetSelector } from './DatasetSelector';
import { ErrorBoundary } from './ErrorBoundary';
import { TableSelector } from './TableSelector';
import { InlineField, Select, InlineSwitch, RadioButtonGroup } from '@grafana/ui';
import { QueryWithDefaults } from './defaults';
import { EditorField } from './EditorField';
import { EditorHeader } from './EditorHeader';
import { EditorRow } from './EditorRow';
import { FlexItem } from './FlexItem';
import { InlineSelect } from './InlineSelect';
import { Space } from './Space';
import {RunQueryButton} from './RunQueryButton'
import { DB, SQLQuery, QueryRowFilter, EditorMode, QueryFormat, QUERY_FORMAT_OPTIONS } from './types';
import { defaultToRawSql } from './utils/sql.utils';

interface QueryHeaderProps {
  db: DB;
  defaultDataset: string;
  enableDatasets: boolean;
  query: QueryWithDefaults;
  onChange: (query: SQLQuery) => void;
  onRunQuery: () => void;
  onQueryRowChange: (queryRowFilter: QueryRowFilter) => void;
  queryRowFilter: QueryRowFilter;
  isQueryRunnable: boolean;
  labels?: Map<string,string>;
}

const editorModes = [
  { label: 'Builder', value: EditorMode.Builder },
  { label: 'Code', value: EditorMode.Code },
];

export function QueryHeader({
  db,
  defaultDataset,
  enableDatasets,
  query,
  queryRowFilter,
  onChange,
  onRunQuery,
  onQueryRowChange,
  isQueryRunnable,
  labels = new Map([['dataset', 'Dataset']]),
}: QueryHeaderProps) {
  const { editorMode } = query;
  const [_, copyToClipboard] = useCopyToClipboard();
  const [showConfirm, setShowConfirm] = useState(false);
  const toRawSql = db.toRawSql || defaultToRawSql;

  const onEditorModeChange = useCallback(
    (newEditorMode: EditorMode) => {
      if (editorMode === EditorMode.Code) {
        setShowConfirm(true);
        return;
      }
      onChange({ ...query, editorMode: newEditorMode });
    },
    [editorMode, onChange, query]
  );

  const onFormatChange = (e: SelectableValue) => {
    const next = { ...query, format: e.value !== undefined ? e.value : QueryFormat.Table };
    onChange(next);
  };

  const onDatasetChange = (e: SelectableValue) => {
    if (e.value === query.dataset) {
      return;
    }

    const next = {
      ...query,
      dataset: e.value,
      table: undefined,
      sql: undefined,
      rawSql: '',
    };

    onChange(next);
  };

  const onTableChange = (e: SelectableValue) => {
    if (e.value === query.table) {
      return;
    }

    const next: SQLQuery = {
      ...query,
      table: e.value,
      sql: undefined,
      rawSql: '',
    };
    onChange(next);
  };

  return (
    <>
      <EditorHeader>
        {/* Backward compatibility check. Inline select uses SelectContainer that was added in 8.3 */}
        <ErrorBoundary
          fallBackComponent={
            <InlineField label="Format" labelWidth={15}>
              <Select
                placeholder="Select format"
                value={query.format}
                onChange={onFormatChange}
                options={QUERY_FORMAT_OPTIONS}
              />
            </InlineField>
          }
        >
          <InlineSelect
            label="Format"
            value={query.format}
            placeholder="Select format"
            menuShouldPortal
            onChange={onFormatChange}
            options={QUERY_FORMAT_OPTIONS}
          />
        </ErrorBoundary>

        {editorMode === EditorMode.Builder && (
          <>
            <InlineSwitch
              label="Filter"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.filter}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, filter: ev.target.checked })
              }
            />

            <InlineSwitch
              label="Group"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.group}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, group: ev.target.checked })
              }
            />

            <InlineSwitch
              label="Order"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.order}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, order: ev.target.checked })
              }
            />

            <InlineSwitch
              label="Preview"
              transparent={true}
              showLabel={true}
              value={queryRowFilter.preview}
              onChange={(ev) =>
                ev.target instanceof HTMLInputElement &&
                onQueryRowChange({ ...queryRowFilter, preview: ev.target.checked })
              }
            />
          </>
        )}

        <FlexItem grow={1} />

        <RunQueryButton
          queryInvalid={isQueryRunnable}
          onClick={() => onRunQuery()}
        />

        <RadioButtonGroup options={editorModes} size="sm" value={editorMode} onChange={onEditorModeChange} />

        <ConfirmModal
          isOpen={showConfirm}
          onCopy={() => {
            setShowConfirm(false);
            copyToClipboard(query.rawSql!);
            onChange({
              ...query,
              rawSql: toRawSql(query),
              editorMode: EditorMode.Builder,
            });
          }}
          onDiscard={() => {
            setShowConfirm(false);
            onChange({
              ...query,
              rawSql: toRawSql(query),
              editorMode: EditorMode.Builder,
            });
          }}
          onCancel={() => setShowConfirm(false)}
        />
      </EditorHeader>

      {editorMode === EditorMode.Builder && (
        <>
          <Space v={0.5} />

          <EditorRow>
            {enableDatasets === true && (
              <EditorField label={labels.get('dataset') || 'Dataset'} width={25}>
                <DatasetSelector
                  db={db}
                  dataset={defaultDataset}
                  value={query.dataset === undefined ? null : query.dataset}
                  onChange={onDatasetChange}
                />
              </EditorField>
            )}

            <EditorField label="Table" width={25}>
              <TableSelector
                db={db}
                dataset={query.dataset || defaultDataset}
                query={query}
                value={query.table === undefined ? null : query.table}
                onChange={onTableChange}
                applyDefault
              />
            </EditorField>
          </EditorRow>
        </>
      )}
    </>
  );
}
