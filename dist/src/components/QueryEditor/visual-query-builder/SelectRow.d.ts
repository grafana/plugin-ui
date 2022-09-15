/// <reference types="react" />
import { SelectableValue } from '@grafana/data';
import { SQLExpression } from '../types';
interface SelectRowProps {
    sql: SQLExpression;
    onSqlChange: (sql: SQLExpression) => void;
    columns?: Array<SelectableValue<string>>;
    functions?: Array<SelectableValue<string>>;
}
export declare function SelectRow({ sql, columns, onSqlChange, functions }: SelectRowProps): JSX.Element;
export {};
