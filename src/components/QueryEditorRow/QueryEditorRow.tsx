import React, { FunctionComponent } from 'react';

export interface QueryEditorRowProps {
  label?: string;
  className?: string;
  noFillEnd?: boolean;
};

export const QueryEditorRow: FunctionComponent<QueryEditorRowProps> = props => {
  const className: string = props.className ?? 'width-8';
  const noFillEnd: boolean = props.noFillEnd ?? false;

  return (
    <div className='gf-form'>
      {props.label && (
        <label className={`gf-form-label query-keyword ${className}`}>{props.label}</label>
      )}
      {props.children}

      <div className={'gf-form--grow'}>
        {noFillEnd || (
          <div className={'gf-form-label gf-form-label--grow'}></div>
        )}
      </div>
    </div>
  );
};
