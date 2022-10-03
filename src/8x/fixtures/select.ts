import { SelectableValue } from '@grafana/data';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Chance } from 'chance';
import { kebabCase } from 'lodash';

export const generateOptions = (): Array<SelectableValue<string>> => {
  const numberOfOptions = 5;

  return Array.from(new Array(numberOfOptions), () => {
    const name = Chance().name();

    return {
      label: name,
      value: kebabCase(name),
    };
  });
};

/**
 * react-select (used by @grafana/ui) renders very differently from the native Select HTML element
 * and because they do not pass data-testid down, it is difficult to grab the
 * correct element and simulate selecting different options
 * created a helper function to click and select a different option manually
 * @param optionLabel
 * @param index If there are multiple inputs and you don't want the first one taken, then pass in the index
 */
export const selectOption = async (optionLabel: string, index?: number, role?: string) => {
  role = role || 'combobox';
  // this needs to be here to support autoFocus=true prop
  fireEvent.blur(screen.getAllByRole(role)[index || 0]);

  // open the dropdown
  fireEvent.keyDown(screen.getAllByRole(role)[index || 0], {
    key: 'ArrowDown',
    keyCode: 40,
  });

  // wait for the list to show
  const option = await waitFor(() => screen.getByText(optionLabel));

  // select the option
  userEvent.click(option);
};
