import React from 'react';
export interface QueryEditorRowProps {
    label?: string;
    className?: string;
    noFillEnd?: boolean;
    children?: React.ReactNode;
}
export declare const QueryEditorRow: (props: QueryEditorRowProps) => JSX.Element;
