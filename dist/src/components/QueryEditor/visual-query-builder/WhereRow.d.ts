/// <reference types="react" />
import { Config } from 'react-awesome-query-builder';
import { SQLExpression } from '../types';
interface SQLBuilderWhereRowProps {
    sql: SQLExpression;
    onSqlChange: (sql: SQLExpression) => void;
    config?: Partial<Config>;
}
export declare function WhereRow({ sql, config, onSqlChange }: SQLBuilderWhereRowProps): JSX.Element | null;
export {};
