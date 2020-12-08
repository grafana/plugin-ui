import { act, render, screen } from '@testing-library/react';
import React from 'react';
import {
  DEFAULT_ADD_ICON,
  DEFAULT_REMOVE_ICON,
  SelectWithIcon,
} from './SelectWithIcon';
import { Chance } from 'chance';
import { generateOptions, selectOption } from '../../__fixtures__/Select';
import userEvent from '@testing-library/user-event';
import { getIcon } from '../../__fixtures__/Icon';

describe('SelectWithIcon', () => {
  describe('display icon is true', () => {
    it('renders icon', () => {
      render(
        <SelectWithIcon
          displayIcon={true}
          options={generateOptions()}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByTitle(DEFAULT_ADD_ICON)).toBeInTheDocument();
    });

    it('does not render dropdown', () => {
      render(
        <SelectWithIcon
          displayIcon={true}
          options={generateOptions()}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByText('Choose')).not.toBeInTheDocument();
    });

    it('does not render children', () => {
      const text = Chance().word();

      render(
        <SelectWithIcon
          displayIcon={true}
          options={generateOptions()}
          onChange={jest.fn()}
        >
          {text}
        </SelectWithIcon>
      );

      expect(screen.queryByText(text)).not.toBeInTheDocument();
    });

    it('hides icon after icon is clicked', async () => {
      render(
        <SelectWithIcon
          displayIcon={true}
          options={generateOptions()}
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
      render(
        <SelectWithIcon
          displayIcon={true}
          options={generateOptions()}
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
      const icon = getIcon();

      render(
        <SelectWithIcon
          displayIcon={true}
          addIcon={icon}
          options={generateOptions()}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByTitle(DEFAULT_ADD_ICON)).not.toBeInTheDocument();
      expect(screen.getByTitle(icon)).toBeInTheDocument();
    });
  });

  describe('display icon is false', () => {
    it('does not render icon', () => {
      render(
        <SelectWithIcon
          displayIcon={false}
          options={generateOptions()}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByTitle(DEFAULT_ADD_ICON)).not.toBeInTheDocument();
    });

    it('renders dropdown', () => {
      render(
        <SelectWithIcon
          displayIcon={false}
          options={generateOptions()}
          onChange={jest.fn()}
        />
      );

      expect(screen.getByText('Choose')).toBeInTheDocument();
    });

    it('renders children', () => {
      const text = Chance().word();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={generateOptions()}
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
          onChange={onChange}
        />
      );

      const selectedLabel = options[0].label!;

      await selectOption(selectedLabel);

      expect(screen.getByText(selectedLabel)).toBeInTheDocument();
    });

    it('calls onChange when dropdown value changes', async () => {
      const options = generateOptions();
      const onChange = jest.fn();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={options}
          onChange={onChange}
        />
      );

      expect(onChange).not.toHaveBeenCalled();

      await selectOption(options[0].label!);

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

    it('calls onChange when dropdown value changes', async () => {
      const options = generateOptions();
      const onChange = jest.fn();

      render(
        <SelectWithIcon
          isMulti={true}
          displayIcon={false}
          options={options}
          onChange={onChange}
        />
      );

      expect(onChange).not.toHaveBeenCalled();

      await selectOption(options[0].label!);

      expect(onChange).toHaveBeenCalledTimes(1);
    });
  });

  describe('remove option', () => {
    it('renders icon if renderRemove is true', () => {
      render(
        <SelectWithIcon
          displayIcon={false}
          options={generateOptions()}
          onChange={jest.fn()}
          renderRemove={true}
        />
      );

      expect(screen.getByTitle(DEFAULT_REMOVE_ICON)).toBeInTheDocument();
    });

    it('does not render icon if renderRemove is false', () => {
      render(
        <SelectWithIcon
          displayIcon={false}
          options={generateOptions()}
          onChange={jest.fn()}
          renderRemove={false}
        />
      );

      expect(screen.queryByTitle(DEFAULT_REMOVE_ICON)).not.toBeInTheDocument();
    });

    it('renders icon passed in', () => {
      const icon = getIcon();

      render(
        <SelectWithIcon
          displayIcon={false}
          renderRemove={true}
          removeIcon={icon}
          options={generateOptions()}
          onChange={jest.fn()}
        />
      );

      expect(screen.queryByTitle(DEFAULT_REMOVE_ICON)).not.toBeInTheDocument();
      expect(screen.getByTitle(icon)).toBeInTheDocument();
    });

    it('calls onRemove after remove button is clicked', () => {
      const onRemove = jest.fn();

      render(
        <SelectWithIcon
          displayIcon={false}
          options={generateOptions()}
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

  it('renders custom value', () => {
    render(
      <SelectWithIcon
        allowCustomValue={true}
        displayIcon={false}
        options={generateOptions()}
        onChange={jest.fn()}
      />
    );

    const customValue = Chance().word();

    userEvent.type(screen.getByText('Choose'), `${customValue}{enter}`);

    expect(screen.queryByText('Choose')).not.toBeInTheDocument();
    expect(screen.getByText(customValue)).toBeInTheDocument();
  });
});
