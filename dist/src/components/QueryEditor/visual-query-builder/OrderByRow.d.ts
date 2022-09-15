/// <reference types="react" />
import { SelectableValue } from '@grafana/data';
import { SQLExpression } from '../types';
declare type OrderByRowProps = {
    sql: SQLExpression;
    onSqlChange: (sql: SQLExpression) => void;
    columns?: Array<SelectableValue<string>>;
    showOffset?: boolean;
};
export declare function OrderByRow({ sql, onSqlChange, columns, showOffset }: OrderByRowProps): JSX.Element;
export {};
