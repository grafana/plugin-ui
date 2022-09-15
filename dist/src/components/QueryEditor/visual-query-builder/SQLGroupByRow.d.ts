/// <reference types="react" />
import { SelectableValue } from '@grafana/data';
import { QueryWithDefaults } from '../defaults';
import { SQLQuery, DB } from '../types';
interface SQLGroupByRowProps {
    fields: SelectableValue[];
    query: QueryWithDefaults;
    onQueryChange: (query: SQLQuery) => void;
    db: DB;
}
export declare function SQLGroupByRow({ fields, query, onQueryChange, db }: SQLGroupByRowProps): JSX.Element;
export {};
