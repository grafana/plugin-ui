import { type Grammar } from 'prismjs';
import React from 'react';

import { OperationExplainedBox } from './OperationExplainedBox';
import { RawQuery } from './RawQuery';
import { type QueryBuilderOperation, type VisualQuery, type VisualQueryModeller } from '../types';

interface Props<T extends VisualQuery> {
  query: T;
  queryModeller: VisualQueryModeller;
  explainMode?: boolean;
  stepNumber: number;
  language: {
    grammar: Grammar;
    name: string;
  };
  onMouseEnter?: (op: QueryBuilderOperation, index: number) => void;
  onMouseLeave?: (op: QueryBuilderOperation, index: number) => void;
}

export function OperationListExplained<T extends VisualQuery>({
  query,
  queryModeller,
  stepNumber,
  language,
  onMouseEnter,
  onMouseLeave,
}: Props<T>) {
  return (
    <>
      {query.operations.map((op, index) => {
        const def = queryModeller.getOperationDefinition(op.id);
        if (!def) {
          return `Operation ${op.id} not found`;
        }
        const title = def.renderer(op, def, queryModeller.innerQueryPlaceholder);
        const body = def.explainHandler ? def.explainHandler(op, def) : (def.documentation ?? 'no docs');

        return (
          <div
            key={index}
            onMouseEnter={() => onMouseEnter?.(op, index)}
            onMouseLeave={() => onMouseLeave?.(op, index)}
          >
            <OperationExplainedBox
              stepNumber={index + stepNumber}
              title={<RawQuery query={title} language={language} />}
              markdown={body}
            />
          </div>
        );
      })}
    </>
  );
}
