import React from 'react';
import { LanguageCompletionProvider } from '@grafana/experimental';
import { SQLQuery } from '../types';
declare type Props = {
    query: SQLQuery;
    onChange: (value: SQLQuery, processQuery: boolean) => void;
    children?: (props: {
        formatQuery: () => void;
    }) => React.ReactNode;
    width?: number;
    height?: number;
    completionProvider: LanguageCompletionProvider;
};
export declare function QueryEditorRaw({ children, onChange, query, width, height, completionProvider }: Props): JSX.Element;
export {};
