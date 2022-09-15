/// <reference types="react" />
import { QueryWithDefaults } from './defaults';
import { DB, SQLQuery, QueryRowFilter } from './types';
interface QueryHeaderProps {
    db: DB;
    query: QueryWithDefaults;
    onChange: (query: SQLQuery) => void;
    onRunQuery: () => void;
    onQueryRowChange: (queryRowFilter: QueryRowFilter) => void;
    queryRowFilter: QueryRowFilter;
    isQueryRunnable: boolean;
    labels?: Map<string, string>;
}
export declare function QueryHeader({ db, query, queryRowFilter, onChange, onRunQuery, onQueryRowChange, isQueryRunnable, labels, }: QueryHeaderProps): JSX.Element;
export {};
