/// <reference types="react" />
import { SelectableValue } from '@grafana/data';
import { QueryWithDefaults } from '../defaults';
import { SQLQuery, DB } from '../types';
interface WhereRowProps {
    query: QueryWithDefaults;
    fields: SelectableValue[];
    onQueryChange: (query: SQLQuery) => void;
    db: DB;
}
export declare function SQLWhereRow({ query, fields, onQueryChange, db }: WhereRowProps): JSX.Element;
export {};
