import { QueryEditorFunctionExpression, QueryEditorGroupByExpression, QueryEditorPropertyExpression } from '../expressions';
import { SQLQuery, SQLExpression } from '../types';
export declare function defaultToRawSql({ sql, dataset, table }: SQLQuery): string;
export declare const haveColumns: (columns: SQLExpression['columns']) => columns is QueryEditorFunctionExpression[];
/**
 * Creates a GroupByExpression for a specified field
 */
export declare function setGroupByField(field?: string): QueryEditorGroupByExpression;
/**
 * Creates a PropertyExpression for a specified field
 */
export declare function setPropertyField(field?: string): QueryEditorPropertyExpression;
export declare function createFunctionField(functionName?: string): QueryEditorFunctionExpression;
