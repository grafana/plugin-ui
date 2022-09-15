import { DB, SQLExpression, SQLQuery } from '../types';
interface UseSqlChange {
    db: DB;
    query: SQLQuery;
    onQueryChange: (query: SQLQuery) => void;
}
export declare function useSqlChange({ query, onQueryChange, db }: UseSqlChange): {
    onSqlChange: (sql: SQLExpression) => void;
};
export {};
