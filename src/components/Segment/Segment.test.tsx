import { act, render, screen } from "@testing-library/react";
import React from "react";
import { Segment } from "./Segment";
import { Chance } from "chance";
import { DEFAULT_DELAY } from "../../hooks/useDebounce";
import userEvent from "@testing-library/user-event";

jest.useFakeTimers();
const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

const getOptions = () => {
  return [
    {
      value: "option 1",
      label: "Option 1",
    },
    {
      value: "option 2",
      label: "Option 2",
    },
  ];
};

describe("Segment", () => {
  it("renders value initially", () => {
    const options = getOptions();
    const value = Chance().word();

    render(<Segment options={options} value={value} onDebounce={jest.fn()} />);

    expect(screen.getByText(value)).toBeInTheDocument();
  });

  it("calls onDebounce on first render", () => {
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

  describe("delay has not passed", () => {
    it("renders updated value", async () => {
      const options = getOptions();
      const value = Chance().word();

      render(
        <Segment options={options} value={value} onDebounce={jest.fn()} />
      );

      await user.click(screen.getByText(value));

      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        userEvent.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY - 1);
      });

      expect(screen.getByText(updatedValue.label)).toBeInTheDocument();
    });

    it("does not call onDebounce with default delay", async () => {
      const options = getOptions();
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
        <Segment
          options={options}
          value={value}
          onDebounce={() => debounceFunction()}
        />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      await user.click(screen.getByText(value));

      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        userEvent.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY - 1);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(1);
    });

    it("does not call onDebounce with delay passed in", async () => {
      const options = getOptions();
      const delay = Chance().integer({ min: 2, max: 500 });
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
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

      await user.click(screen.getByText(value));

      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        userEvent.click(element);

        jest.advanceTimersByTime(delay - 1);
      });

      expect(screen.getByText(updatedValue.label)).toBeInTheDocument();

      expect(debounceFunction).toHaveBeenCalledTimes(1);
    });
  });

  describe("delay has passed", () => {
    it("renders updated value", async () => {
      const options = getOptions();
      const value = Chance().word();

      render(
        <Segment options={options} value={value} onDebounce={jest.fn()} />
      );

      expect(screen.getByText(value)).toBeInTheDocument();

      await user.click(screen.getByText(value));

      const updatedValue = options[0];
      act(() => {
        const element = screen.getByText(updatedValue.label)!;
        userEvent.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY);
      });

      expect(screen.getByText(updatedValue.label)).toBeInTheDocument();
    });

    it("calls onDebounce with default delay", async () => {
      const options = getOptions();
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
        <Segment
          options={options}
          value={value}
          onDebounce={() => debounceFunction()}
        />
      );

      expect(debounceFunction).toHaveBeenCalledTimes(1);
      await user.click(screen.getByText(value));

      const updatedValue = options[0];
      await act(async () => {
        const element = screen.getByText(updatedValue.label)!;
        await user.click(element);

        jest.advanceTimersByTime(DEFAULT_DELAY);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(2);
    });

    it("calls onDebounce with delay passed in", async () => {
      const options = getOptions();
      const delay = Chance().integer({ min: 0, max: 500 });
      const value = Chance().word();
      const debounceFunction = jest.fn();

      render(
        <Segment
          options={options}
          value={value}
          onDebounce={() => debounceFunction()}
          delay={delay}
        />
      );

      expect(screen.getByText(value)).toBeInTheDocument();

      expect(debounceFunction).toHaveBeenCalledTimes(1);

      await user.click(screen.getByText(value));

      const updatedValue = options[0];

      // Update the input element / fire the input change event
      await act(async () => {
        const element = screen.getByText(updatedValue.label)!;
        await user.click(element);

        jest.advanceTimersByTime(delay);
      });

      expect(debounceFunction).toHaveBeenCalledTimes(2);
    });
  });
});
