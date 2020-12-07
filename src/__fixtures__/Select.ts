import { SelectableValue } from '@grafana/data';
import { screen, waitFor } from '@testing-library/react';
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

// react-select (used by @grafana/ui) renders very differently from the native Select HTML element
// and because they do not pass data-testid down, it is difficult to grab the
// correct element and simulate selecting different options
// created a helper function to click and select a different option manually
export const selectOption = async (
  optionLabel: string,
  placeholderText: string = 'Choose'
) => {
  const select = screen.getByText(placeholderText);

  // open the dropdown
  userEvent.click(select);

  // wait for the list to show
  const option = await waitFor(() => screen.getByText(optionLabel));

  // select the option
  userEvent.click(option);
};
