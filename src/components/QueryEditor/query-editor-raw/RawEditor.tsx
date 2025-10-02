import { css } from '@emotion/css';
import { useMemo, useState } from 'react';
import { useMeasure } from 'react-use';
// @ts-ignore
import AutoSizer from 'react-virtualized-auto-sizer';

import { type GrafanaTheme2 } from '@grafana/data';
import { Modal, useStyles2, useTheme2 } from '@grafana/ui';

import { QueryEditorRaw } from './QueryEditorRaw';
import { QueryToolbox } from './QueryToolbox';
import { type QueryEditorProps, type SQLQuery } from '../types';

interface RawEditorProps extends Omit<QueryEditorProps, 'onChange'> {
  onRunQuery: () => void;
  onChange: (q: SQLQuery, processQuery: boolean) => void;
  onValidate: (isValid: boolean) => void;
  queryToValidate: SQLQuery;
}

export function RawEditor({ db, query, onChange, onRunQuery, onValidate, queryToValidate, range }: RawEditorProps) {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const [isExpanded, setIsExpanded] = useState(false);
  const [toolboxRef, toolboxMeasure] = useMeasure<HTMLDivElement>();
  const [editorRef, editorMeasure] = useMeasure<HTMLDivElement>();

  const completionProvider = useMemo(() => db.getSqlCompletionProvider(), [db]);

  const renderQueryEditor = (width?: number, height?: number) => {
    return (
      <QueryEditorRaw
        completionProvider={completionProvider}
        query={query}
        width={width}
        height={height ? height - toolboxMeasure.height : undefined}
        onChange={onChange}
      >
        {({ formatQuery }) => {
          return (
            <div ref={toolboxRef}>
              <QueryToolbox
                db={db}
                query={queryToValidate}
                onValidate={onValidate}
                onFormatCode={formatQuery}
                showTools
                range={range}
                onExpand={setIsExpanded}
                isExpanded={isExpanded}
              />
            </div>
          );
        }}
      </QueryEditorRaw>
    );
  };

  interface AutoSizerProps {
    width: number;
    height: number;
  }

  const renderEditor = (standalone = false) => {
    return standalone ? (
      <AutoSizer>
        {({ width, height }: AutoSizerProps) => {
          return renderQueryEditor(width, height);
        }}
      </AutoSizer>
    ) : (
      <div ref={editorRef}>{renderQueryEditor()}</div>
    );
  };

  const renderPlaceholder = () => {
    return (
      <div
        style={{
          width: editorMeasure.width,
          height: editorMeasure.height,
          background: theme.colors.background.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        Editing in expanded code editor
      </div>
    );
  };

  return (
    <>
      {isExpanded ? renderPlaceholder() : renderEditor()}
      {isExpanded && (
        <Modal
          title={`Query ${query.refId}`}
          closeOnBackdropClick={false}
          closeOnEscape={false}
          className={styles.modal}
          contentClassName={styles.modalContent}
          isOpen={isExpanded}
          onDismiss={() => {
            setIsExpanded(false);
          }}
        >
          {renderEditor(true)}
        </Modal>
      )}
    </>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    modal: css`
      width: 95vw;
      height: 95vh;
    `,
    modalContent: css`
      height: 100%;
      padding-top: 0;
    `,
  };
}
