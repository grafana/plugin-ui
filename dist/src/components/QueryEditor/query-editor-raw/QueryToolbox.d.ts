/// <reference types="react" />
import { QueryValidatorProps } from './QueryValidator';
interface QueryToolboxProps extends Omit<QueryValidatorProps, 'onValidate'> {
    showTools?: boolean;
    isExpanded?: boolean;
    onFormatCode?: () => void;
    onExpand?: (expand: boolean) => void;
    onValidate?: (isValid: boolean) => void;
}
export declare function QueryToolbox({ showTools, onFormatCode, onExpand, isExpanded, ...validatorProps }: QueryToolboxProps): JSX.Element;
export {};
