import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { Segment } from './Segment';
import { Chance } from 'chance';
import { DEFAULT_DELAY } from '../../hooks/useDebounce';

jest.useFakeTimers();

const getOptions  = () => {
  return [{
    value: "option 1",
    label: "Option 1",
  }, {
    value: "option 2",
    label: "Option 2",
  }]
}

describe('Segment', () => {

  it('renders value initially', () => {
    const options = getOptions();
    const value = Chance().word();

    render(<Segment options={options} value={value} onDebounce={jest.fn()} />);

    expect(screen.getByText(value)).toBeInTheDocument();
  });

  it('calls onDebounce on first render', () => {
    const options = getOptions();
    const debounceFunction = jest.fn();

    render(
      <Segment
        options={options} 
        value={Chance().word()}
        onDebounce={() => debounceFunction()}
      />
    );

    expect(debounceFunction).toHaveBeenCalledTimes(1);
  });

  describe('delay has not passed', () => {
    it('renders updated value', () => {
      const options = getOptions();
      const value = Chance().word();

      const { container } =render(<Segment
        options={options} 
        value={value} onDebounce={jest.fn()} />);

      // Click the element to display the input
      container.querySelector('a')!.click();
      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        fireEvent.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY - 1);
      });

      expect(screen.getByText(updatedValue.value)).toBeInTheDocument();
    });

    it('does not call onDebounce with default delay', () => {
      const options = getOptions();
      const value = Chance().word();
      const debounceFunction = jest.fn();

      const { container } = render(
        <Segment options={options} value={value} onDebounce={() => debounceFunction()} />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      // Click the element to display the input
      container.querySelector('a')!.click();
      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        fireEvent.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY - 1);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(1);
    });

    it('does not call onDebounce with delay passed in', () => {
      const options = getOptions();
      const delay = Chance().integer({ min: 2, max: 500 });
      const value = Chance().word();
      const debounceFunction = jest.fn();

      const { container } = render(
        <Segment
          options={options}
          value={value}
          onDebounce={() => debounceFunction()}
          // setting this with a min of 2 to test that we still do not call onDebounce
          // which would always be called if the delay is 0 in this test
          delay={delay}
        />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      // Click the element to display the input
      container.querySelector('a')!.click();
      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        fireEvent.click(element);

        jest.advanceTimersByTime(delay - 1);
      });

      expect(screen.getByText(updatedValue.value)).toBeInTheDocument();

      expect(debounceFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('delay has passed', () => {
    it('renders updated value', () => {
      const options = getOptions();
      const value = Chance().word();

      const { container } = render(<Segment options={options} value={value} onDebounce={jest.fn()} />);

      expect(screen.getByText(value)).toBeInTheDocument();

      // Click the element to display the input
      container.querySelector('a')!.click();
      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        fireEvent.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY);
      });

      expect(screen.getByText(updatedValue.value)).toBeInTheDocument();
    });

    it('calls onDebounce with default delay', () => {
      const options = getOptions();
      const value = Chance().word();
      const debounceFunction = jest.fn();

      const { container } = render(
        <Segment options={options} value={value} onDebounce={() => debounceFunction()} />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);
      // Click the element to display the input
      container.querySelector('a')!.click();
      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        fireEvent.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(2);
    });

    it('calls onDebounce with delay passed in', () => {
      const options = getOptions();
      const delay = Chance().integer({ min: 0 });
      const value = Chance().word();
      const debounceFunction = jest.fn();

      const { container } = render(
        <Segment
          options={options}
          value={value}
          onDebounce={() => debounceFunction()}
          delay={delay}
        />
        );


      expect(container.querySelector('a')?.text).toBe(value);

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      // Click the element to display the input
      container.querySelector('a')!.click();

      const updatedValue = options[0];

      // Update the input element / fire the input change event
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        fireEvent.click(element);

        jest.advanceTimersByTime(delay);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(2);
    });
  });
});
