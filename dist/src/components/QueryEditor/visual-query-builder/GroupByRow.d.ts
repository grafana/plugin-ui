/// <reference types="react" />
import { SelectableValue } from '@grafana/data';
import { SQLExpression } from '../types';
interface GroupByRowProps {
    sql: SQLExpression;
    onSqlChange: (sql: SQLExpression) => void;
    columns?: Array<SelectableValue<string>>;
}
export declare function GroupByRow({ sql, columns, onSqlChange }: GroupByRowProps): JSX.Element;
export {};
