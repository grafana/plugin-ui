/// <reference types="react" />
import { SelectableValue } from '@grafana/data';
import { QueryWithDefaults } from '../defaults';
import { SQLQuery, DB } from '../types';
declare type SQLOrderByRowProps = {
    fields: SelectableValue[];
    query: QueryWithDefaults;
    onQueryChange: (query: SQLQuery) => void;
    db: DB;
};
export declare function SQLOrderByRow({ fields, query, onQueryChange, db }: SQLOrderByRowProps): JSX.Element;
export {};
