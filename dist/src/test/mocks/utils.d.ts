export declare const generateBoolean: () => boolean;
export declare const undefinedOr: (fn: Function) => any;
export declare const generateArrayOf: (fn: Function, numberOf?: number) => any[];
/**
 * Opens a Select or MultiSelect dropdown
 *
 * @param {HTMLElement} container The container wrapping the Select or MultiSelect component
 * @param {string} optionLabel The option text we want to type or search
 */
export declare const openSelect: (container: HTMLElement, optionLabel?: string) => void;
/**
 * Selects an option from the Select or MultiSelect component
 *
 * @param {HTMLElement} container The container wrapping the Select or MultiSelect component
 * @param {string} optionLabel The option we want to select
 * @param {boolean} [typeOptionLabel=false] If we should type the optional label after opening - this is useful for AsyncSelect
 */
export declare const selectOption: (container: HTMLElement, optionLabel: string, typeOptionLabel?: boolean) => Promise<void>;
