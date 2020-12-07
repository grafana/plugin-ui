import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import {
  DEFAULT_ADD_ICON,
  DEFAULT_REMOVE_ICON,
  SelectWithIcon,
} from './SelectWithIcon';
import { Chance } from 'chance';
import { generateOptions } from '../../__fixtures__/Select';
import userEvent from '@testing-library/user-event';
import { getIcon } from '../../__fixtures__/Icon';

describe('SelectWithIcon', () => {
  describe('display icon is true', () => {
    it('renders icon', () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={true}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByTitle(DEFAULT_ADD_ICON)).toBeInTheDocument();
    });

    it('does not render dropdown', () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={true}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByText('Choose')).not.toBeInTheDocument();
    });

    it('does not render children', () => {
      const options = generateOptions();
      const text = Chance().word();

      render(
        <SelectWithIcon
          displayIcon={true}
          options={options}
          onChange={jest.fn()}
        >
          {text}
        </SelectWithIcon>
      );

      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });

    it('hides icon after icon is clicked', async () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={true}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByTitle(DEFAULT_ADD_ICON)).toBeInTheDocument();

      act(() => {
        userEvent.click(screen.getByTitle(DEFAULT_ADD_ICON));
      });

      expect(screen.queryByTitle(DEFAULT_ADD_ICON)).not.toBeInTheDocument();
    });

    it('renders dropdown after icon is clicked', async () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={true}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByText('Choose')).not.toBeInTheDocument();

      act(() => {
        userEvent.click(screen.getByTitle(DEFAULT_ADD_ICON));
      });

      expect(screen.getByText('Choose')).toBeInTheDocument();
    });

    it('renders icon passed in', () => {
      const options = generateOptions();
      const icon = getIcon();

      render(
        <SelectWithIcon
          displayIcon={true}
          addIcon={icon}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByTitle(DEFAULT_ADD_ICON)).not.toBeInTheDocument();
      expect(screen.getByTitle(icon)).toBeInTheDocument();
    });
  });

  describe('display icon is false', () => {
    it('does not render icon', () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByTitle(DEFAULT_ADD_ICON)).not.toBeInTheDocument();
    });

    it('renders dropdown', () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Choose')).toBeInTheDocument();
    });

    it('renders children', () => {
      const options = generateOptions();
      const text = Chance().word();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={jest.fn()}
        >
          {text}
        </SelectWithIcon>
      );

      expect(screen.getByText(text)).toBeInTheDocument();
    });

    it('renders updated value when dropdown value changes', async () => {
      const options = generateOptions();
      const onChange = jest.fn();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={onChange()}
        />
      );

      const select = await waitFor(() => screen.getByRole('textbox'));
      const selectedValue = options[0].value!;

      expect(screen.queryByDisplayValue(selectedValue)).not.toBeInTheDocument();

      act(() => {
        fireEvent.change(select, { target: { value: selectedValue } });
      });

      expect(screen.getByDisplayValue(selectedValue)).toBeInTheDocument();
    });

    it('calls onChange when dropdown value changes', async () => {
      const options = generateOptions();
      const onChange = jest.fn();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={onChange()}
        />
      );

      expect(onChange).not.toHaveBeenCalled();

      const select = await waitFor(() => screen.getByRole('textbox'));

      act(() => {
        fireEvent.change(select, { target: { value: options[0].value! } });
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('multi', () => {
    it('renders dropdown with multiple values', () => {
      const options = generateOptions();

      const firstSelected = options[0];
      const secondSelected = options[1];

      render(
        <SelectWithIcon
          isMulti={true}
          displayIcon={false}
          options={options}
          value={[firstSelected.value!, secondSelected.value!]}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText(firstSelected.label!)).toBeInTheDocument();
      expect(screen.getByText(secondSelected.label!)).toBeInTheDocument();

      // just checking we are testing by what is being displayed and not just checking
      // all options available
      expect(screen.queryByText(options[2].label!)).not.toBeInTheDocument();
    });

    it('renders updated value when dropdown value changes', async () => {
      const options = generateOptions();
      const firstSelected = options[0];
      const secondSelected = options[1];

      render(
        <SelectWithIcon
          isMulti={true}
          displayIcon={false}
          options={options}
          value={[]}
          onChange={jest.fn()}
        />
      );

      const select = await waitFor(() => screen.getByRole('textbox'));

      expect(
        screen.queryByDisplayValue(
          `${firstSelected.value!},${secondSelected.value!}`
        )
      ).not.toBeInTheDocument();

      act(() => {
        fireEvent.change(select, {
          target: { value: [firstSelected.value!, secondSelected.value!] },
        });
      });

      expect(
        screen.getByDisplayValue(
          `${firstSelected.value!},${secondSelected.value!}`
        )
      ).toBeInTheDocument();
    });

    it('calls onChange when dropdown value changes', async () => {
      const options = generateOptions();
      const onChange = jest.fn();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={onChange()}
        />
      );

      expect(onChange).not.toHaveBeenCalled();

      const select = await waitFor(() => screen.getByRole('textbox'));

      act(() => {
        fireEvent.change(select, {
          target: { value: [options[0].value!, options[1].value!] },
        });
      });

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove option', () => {
    it('renders icon if renderRemove is true', () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={jest.fn()}
          renderRemove={true}
        />
      );

      expect(screen.getByTitle(DEFAULT_REMOVE_ICON)).toBeInTheDocument();
    });

    it('does not render icon if renderRemove is false', () => {
      const options = generateOptions();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={jest.fn()}
          renderRemove={false}
        />
      );

      expect(screen.queryByTitle(DEFAULT_REMOVE_ICON)).not.toBeInTheDocument();
    });

    it('renders icon passed in', () => {
      const options = generateOptions();
      const icon = getIcon();

      render(
        <SelectWithIcon
          displayIcon={false}
          renderRemove={true}
          removeIcon={icon}
          options={options}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByTitle(DEFAULT_REMOVE_ICON)).not.toBeInTheDocument();
      expect(screen.getByTitle(icon)).toBeInTheDocument();
    });

    it('calls onRemove after remove button is clicked', () => {
      const options = generateOptions();
      const onRemove = jest.fn();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={jest.fn()}
          renderRemove={true}
          onRemove={onRemove}
        />
      );

      expect(onRemove).toHaveBeenCalledTimes(0);

      act(() => {
        userEvent.click(screen.getByTitle(DEFAULT_REMOVE_ICON));
      });

      expect(onRemove).toHaveBeenCalledTimes(1);
    });
  });
});
