import { css } from '@emotion/css';
import { useState, memo } from 'react';
import { usePopperTooltip } from 'react-popper-tooltip';

import { type GrafanaTheme2, renderMarkdown } from '@grafana/data';
import { Button, Portal, useStyles2 } from '@grafana/ui';

import { type QueryBuilderOperation, type QueryBuilderOperationDefinition } from '../types';
import { FlexItem } from '../../QueryEditor/FlexItem';

interface Props {
  operation: QueryBuilderOperation;
  definition: QueryBuilderOperationDefinition;
  innerQueryPlaceholder: string;
}

export const OperationInfoButton = memo<Props>(({ definition, operation, innerQueryPlaceholder }) => {
  const styles = useStyles2(getStyles);
  const [show, setShow] = useState(false);
  const { getTooltipProps, setTooltipRef, setTriggerRef, visible } = usePopperTooltip({
    placement: 'top',
    visible: show,
    offset: [0, 16],
    onVisibleChange: setShow,
    interactive: true,
    trigger: ['click'],
  });

  return (
    <>
      <Button
        title="Click to show description"
        ref={setTriggerRef}
        icon="info-circle"
        size="sm"
        variant="secondary"
        fill="text"
      />
      {visible && (
        <Portal>
          <div ref={setTooltipRef} {...getTooltipProps()} className={styles.docBox}>
            <div className={styles.docBoxHeader}>
              <span>{definition.renderer(operation, definition, innerQueryPlaceholder)}</span>
              <FlexItem grow={1} />
              <Button
                icon="times"
                onClick={() => setShow(false)}
                fill="text"
                variant="secondary"
                title="Remove operation"
              />
            </div>
            <div
              className={styles.docBoxBody}
              dangerouslySetInnerHTML={{ __html: getOperationDocs(definition, operation) }}
            ></div>
          </div>
        </Portal>
      )}
    </>
  );
});

OperationInfoButton.displayName = 'OperationDocs';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    docBox: css({
      overflow: 'hidden',
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.strong}`,
      boxShadow: theme.shadows.z3,
      maxWidth: '600px',
      padding: theme.spacing(1),
      borderRadius: theme.shape.radius.default,
      zIndex: theme.zIndex.tooltip,
    }),
    docBoxHeader: css({
      fontSize: theme.typography.h5.fontSize,
      fontFamily: theme.typography.fontFamilyMonospace,
      paddingBottom: theme.spacing(1),
      display: 'flex',
      alignItems: 'center',
    }),
    docBoxBody: css({
      // The markdown paragraph has a marginBottom this removes it
      marginBottom: theme.spacing(-1),
      color: theme.colors.text.secondary,
    }),
    signature: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontFamily: theme.typography.fontFamilyMonospace,
    }),
    dropdown: css({
      opacity: 0,
      color: theme.colors.text.secondary,
    }),
  };
};
function getOperationDocs(def: QueryBuilderOperationDefinition, op: QueryBuilderOperation): string {
  return renderMarkdown(def.explainHandler ? def.explainHandler(op, def) : (def.documentation ?? 'no docs'));
}
