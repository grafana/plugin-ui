import { SelectableValue } from '@grafana/data';
export declare const generateOptions: () => Array<SelectableValue<string>>;
/**
 * react-select (used by @grafana/ui) renders very differently from the native Select HTML element
 * and because they do not pass data-testid down, it is difficult to grab the
 * correct element and simulate selecting different options
 * created a helper function to click and select a different option manually
 * @param optionLabel
 * @param index If there are multiple inputs and you don't want the first one taken, then pass in the index
 */
export declare const selectOption: (optionLabel: string, index?: number, role?: string) => Promise<void>;
