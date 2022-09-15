/// <reference types="react" />
import { QueryEditorProps, SQLQuery } from '../types';
interface RawEditorProps extends Omit<QueryEditorProps, 'onChange'> {
    onRunQuery: () => void;
    onChange: (q: SQLQuery, processQuery: boolean) => void;
    onValidate: (isValid: boolean) => void;
    queryToValidate: SQLQuery;
}
export declare function RawEditor({ db, query, onChange, onRunQuery, onValidate, queryToValidate, range }: RawEditorProps): JSX.Element;
export {};
