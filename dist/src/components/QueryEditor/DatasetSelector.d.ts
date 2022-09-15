import React from 'react';
import { SelectableValue } from '@grafana/data';
import { DB, ResourceSelectorProps } from './types';
interface DatasetSelectorProps extends ResourceSelectorProps {
    db: DB;
    value: string | null;
    applyDefault?: boolean;
    disabled?: boolean;
    onChange: (v: SelectableValue) => void;
}
export declare const DatasetSelector: React.FC<DatasetSelectorProps>;
export {};
