import { useCallback, useState, useId } from 'react';
import { useCopyToClipboard } from 'react-use';

import { type SelectableValue } from '@grafana/data';

import { ConfirmModal } from './ConfirmModal';
import { DatasetSelector } from './DatasetSelector';
import { CatalogSelector } from './CatalogSelector';
import { SchemaSelector } from './SchemaSelector';
import { TableSelector } from './TableSelector';
import { InlineSwitch, RadioButtonGroup } from '@grafana/ui';
import { type QueryWithDefaults } from './defaults';
import { EditorField } from './EditorField';
import { EditorHeader } from './EditorHeader';
import { EditorRow } from './EditorRow';
import { FlexItem } from './FlexItem';
import { InlineSelect } from './InlineSelect';
import { Space } from './Space';
import { RunQueryButton } from './RunQueryButton';
import { type DB, type SQLQuery, type QueryRowFilter, EditorMode, QueryFormat, QUERY_FORMAT_OPTIONS } from './types';
import { getRawSqlFn } from './utils/sql.utils';

interface QueryHeaderProps {
  db: DB;
  defaultDataset: string;
  enableDatasets: boolean;
  enableCatalogs?: boolean;
  query: QueryWithDefaults;
  onChange: (query: SQLQuery) => void;
  onRunQuery: () => void;
  onQueryRowChange: (queryRowFilter: QueryRowFilter) => void;
  queryRowFilter: QueryRowFilter;
  isQueryRunnable: boolean;
  labels?: Map<string, string>;
}

const editorModes = [
  { label: 'Builder', value: EditorMode.Builder },
  { label: 'Code', value: EditorMode.Code },
];

export function QueryHeader({
  db,
  defaultDataset,
  enableDatasets,
  enableCatalogs = false,
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
  const toRawSql = getRawSqlFn(db);
  const htmlId = useId();

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

  const onCatalogChange = (catalog: string | null) => {
    if (catalog === query.catalog) {
      return;
    }

    const next: SQLQuery = {
      ...query,
      catalog: catalog || undefined,
      schema: undefined,
      table: undefined,
      sql: undefined,
      rawSql: '',
    };
    onChange(next);
  };

  const onSchemaChange = (schema: string | null) => {
    if (schema === query.schema) {
      return;
    }

    const next: SQLQuery = {
      ...query,
      schema: schema || undefined,
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
        <InlineSelect
          label="Format"
          value={query.format}
          placeholder="Select format"
          menuShouldPortal
          onChange={onFormatChange}
          options={QUERY_FORMAT_OPTIONS}
        />
        {editorMode === EditorMode.Builder && (
          <>
            <InlineSwitch
              id={`sql-filter-${htmlId}`}
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
              id={`sql-group-${htmlId}`}
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
              id={`sql-order-${htmlId}`}
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
              id={`sql-preview-${htmlId}`}
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

        <RunQueryButton queryInvalid={!isQueryRunnable} onClick={() => onRunQuery()} />

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
            {enableDatasets === true && !enableCatalogs && (
              <EditorField label={labels.get('dataset') || 'Dataset'} width={25}>
                <DatasetSelector
                  db={db}
                  inputId={`sql-dataset-${htmlId}`}
                  dataset={defaultDataset}
                  value={query.dataset === undefined ? null : query.dataset}
                  onChange={onDatasetChange}
                />
              </EditorField>
            )}

            {enableCatalogs && (
              <>
                <EditorField label={labels.get('catalog') || 'Catalog'} width={25}>
                  <CatalogSelector
                    db={db}
                    inputId={`sql-catalog-${htmlId}`}
                    value={query.catalog === undefined ? null : query.catalog}
                    onChange={onCatalogChange}
                  />
                </EditorField>

                <EditorField label={labels.get('schema') || 'Schema'} width={25}>
                  <SchemaSelector
                    db={db}
                    inputId={`sql-schema-${htmlId}`}
                    catalog={query.catalog === undefined ? null : query.catalog}
                    value={query.schema === undefined ? null : query.schema}
                    onChange={onSchemaChange}
                  />
                </EditorField>
              </>
            )}

            <EditorField label="Table" width={25}>
              <TableSelector
                db={db}
                inputId={`sql-table-${htmlId}`}
                dataset={enableCatalogs ? undefined : query.dataset || defaultDataset}
                catalog={enableCatalogs ? (query.catalog === undefined ? null : query.catalog) : undefined}
                schema={enableCatalogs ? (query.schema === undefined ? null : query.schema) : undefined}
                query={query}
                value={query.table === undefined ? null : query.table}
                onChange={onTableChange}
                enableCatalogs={enableCatalogs}
                applyDefault
              />
            </EditorField>
          </EditorRow>
        </>
      )}
    </>
  );
}
