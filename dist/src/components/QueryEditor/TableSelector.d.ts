import React from 'react';
import { SelectableValue } from '@grafana/data';
import { DB, ResourceSelectorProps } from './types';
import { QueryWithDefaults } from './defaults';
interface TableSelectorProps extends ResourceSelectorProps {
    db: DB;
    value: string | null;
    query: QueryWithDefaults;
    onChange: (v: SelectableValue) => void;
}
export declare const TableSelector: React.FC<TableSelectorProps>;
export {};
