import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import DebounceInput from './DebounceInput';
import { Chance } from 'chance';
import { DEFAULT_DELAY } from '../../hooks/useDebounce';

jest.useFakeTimers();

describe('DebounceInput', () => {
  it('renders value initially', () => {
    const value = Chance().word();

    render(<DebounceInput value={value} onDebounce={jest.fn()} />);

    expect(screen.getByDisplayValue(value)).toBeInTheDocument();
  });

  it('calls onDebounce on first render', () => {
    const debounceFunction = jest.fn();

    render(
      <DebounceInput
        value={Chance().word()}
        onDebounce={() => debounceFunction()}
      />
    );

    expect(debounceFunction).toHaveBeenCalledTimes(1);
  });

  describe('delay has not passed', () => {
    it('renders updated value', () => {
      const value = Chance().word();

      render(<DebounceInput value={value} onDebounce={jest.fn()} />);

      const updatedValue = Chance().word();
      act(() => {
        fireEvent.change(screen.getByDisplayValue(value), {
          target: { value: updatedValue },
        });

        jest.advanceTimersByTime(DEFAULT_DELAY - 1);
      });

      expect(screen.getByDisplayValue(updatedValue)).toBeInTheDocument();
    });

    it('does not call onDebounce with default delay', () => {
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
        <DebounceInput value={value} onDebounce={() => debounceFunction()} />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.change(screen.getByDisplayValue(value), {
          target: { value: Chance().word() },
        });

        jest.advanceTimersByTime(DEFAULT_DELAY - 1);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(1);
    });

    it('does not call onDebounce with delay passed in', () => {
      const delay = Chance().integer({ min: 2, max: 500 });
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
        <DebounceInput
          value={value}
          onDebounce={() => debounceFunction()}
          // setting this with a min of 2 to test that we still do not call onDebounce
          // which would always be called if the delay is 0 in this test
          delay={delay}
        />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.change(screen.getByDisplayValue(value), {
          target: { value: Chance().word() },
        });

        jest.advanceTimersByTime(delay - 1);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe('delay has passed', () => {
    it('renders updated value', () => {
      const value = Chance().word();

      render(<DebounceInput value={value} onDebounce={jest.fn()} />);

      expect(screen.getByDisplayValue(value)).toBeInTheDocument();

      const updatedValue = Chance().word();
      act(() => {
        fireEvent.change(screen.getByDisplayValue(value), {
          target: { value: updatedValue },
        });

        jest.advanceTimersByTime(DEFAULT_DELAY);
      });

      expect(screen.getByDisplayValue(updatedValue)).toBeInTheDocument();
    });

    it('calls onDebounce with default delay', () => {
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
        <DebounceInput value={value} onDebounce={() => debounceFunction()} />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      act(() => {
        fireEvent.change(screen.getByDisplayValue(value), {
          target: { value: Chance().word() },
        });

        jest.advanceTimersByTime(DEFAULT_DELAY);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(2);
    });

    it('calls onDebounce with delay passed in', () => {
      const delay = Chance().integer({ min: 0 });
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
        <DebounceInput
          value={value}
          onDebounce={() => debounceFunction()}
          delay={delay}
        />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);
      expect(screen.getByDisplayValue(value)).toBeInTheDocument();

      const updatedValue = Chance().word();
      act(() => {
        fireEvent.change(screen.getByDisplayValue(value), {
          target: { value: updatedValue },
        });

        jest.advanceTimersByTime(delay);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(2);
    });
  });
});
