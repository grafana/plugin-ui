import React from 'react';
import { CascaderOption } from '@grafana/ui';
export interface AsyncButtonCascaderProps {
    options: CascaderOption[];
    children: string;
    disabled?: boolean;
    value: string[];
    fieldNames?: {
        label: string;
        value: string;
        children: string;
    };
    loadData?: (selectedOptions: CascaderOption[]) => void;
    onChange?: (value: string[], selectedOptions: CascaderOption[]) => void;
    onPopupVisibleChange?: (visible: boolean) => void;
    className?: string;
}
export declare const AsyncButtonCascader: React.FC<AsyncButtonCascaderProps>;
