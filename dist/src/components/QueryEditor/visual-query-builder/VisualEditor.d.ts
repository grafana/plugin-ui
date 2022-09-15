import React from 'react';
import { DB, QueryEditorProps, QueryRowFilter } from '../types';
import { SQLQuery } from '../types';
import { TimeRange } from '@grafana/data';
interface VisualEditorProps extends QueryEditorProps {
    query: SQLQuery;
    db: DB;
    queryRowFilter: QueryRowFilter;
    onChange: (q: SQLQuery) => void;
    onValidate: (isValid: boolean) => void;
    range?: TimeRange;
}
export declare const VisualEditor: React.FC<VisualEditorProps>;
export {};
