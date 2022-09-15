import React, { ComponentProps } from 'react';
import { Field, PopoverContent } from '@grafana/ui';
interface EditorFieldProps extends ComponentProps<typeof Field> {
    label: string;
    children: React.ReactElement;
    width?: number | string;
    optional?: boolean;
    tooltip?: PopoverContent;
}
export declare const EditorField: React.FC<EditorFieldProps>;
export {};
