/// <reference types="react" />
import { SelectableValue } from '@grafana/data';
import { QueryWithDefaults } from '../defaults';
import { SQLQuery, DB } from '../types';
interface SQLSelectRowProps {
    fields: SelectableValue[];
    query: QueryWithDefaults;
    onQueryChange: (query: SQLQuery) => void;
    db: DB;
}
export declare function SQLSelectRow({ fields, query, onQueryChange, db }: SQLSelectRowProps): JSX.Element;
export {};
