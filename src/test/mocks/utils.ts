import { Chance } from 'chance';
import { within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export const generateBoolean = () => Chance().pickone([true, false]);

export const undefinedOr = (fn: Function) =>
  Chance().pickone([undefined, fn()]);

export const generateArrayOf = (fn: Function, numberOf: number = 3) =>
  Array.from(new Array(numberOf), () => fn());

/**
 * Opens a Select or MultiSelect dropdown
 *
 * @param container The container wrapping the Select or MultiSelect component
 */
export const openSelect = (container: HTMLElement) => {
  const selectInput = within(container).getByRole('textbox');

  // this needs to be here to support autoFocus=true prop
  fireEvent.blur(selectInput);

  // open the dropdown
  userEvent.type(selectInput, '{arrowdown}');
};

/**
 * Selects an option from the Select or MultiSelect component
 *
 * @param container The container wrapping the Select or MultiSelect component
 * @param optionLabel The option we want to select
 */
export const selectOption = async (
  container: HTMLElement,
  optionLabel: string
) => {
  openSelect(container);

  // wait for the list to show
  const option = await waitFor(() => within(container).getByText(optionLabel));

  // select the option
  userEvent.click(option);
};
