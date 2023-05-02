import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomHeader, Props } from "./CustomHeader";

type PartialHeader = Partial<Props["header"]>;
type PartialProps = Partial<Omit<Props, "header"> & { header: PartialHeader }>;

const getProps = (partialProps?: PartialProps): Props => {
  return {
    onChange: jest.fn(),
    onBlur: jest.fn(),
    onDelete: jest.fn(),
    readOnly: false,
    ...partialProps,
    header: {
      id: "test-id",
      name: "",
      value: "",
      configured: false,
      ...partialProps?.header,
    },
  };
};

describe("<CustomHeader />", () => {
  it("should render name and value fields", () => {
    render(<CustomHeader {...getProps()} />);

    expect(screen.getByPlaceholderText("X-Custom-Header")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Header value")).toBeInTheDocument();
  });

  it("should render header name and value", () => {
    const props = getProps({
      header: { name: "X-Test-Test", value: "test_value" },
    });
    render(<CustomHeader {...props} />);
    const nameField = screen.getByPlaceholderText("X-Custom-Header");
    const valueField = screen.getByPlaceholderText("Header value");

    expect(nameField).toHaveValue("X-Test-Test");
    expect(valueField).toHaveValue("test_value");
  });

  it("should call `onChange` when user types in header name field", () => {
    const props = getProps({ onChange: jest.fn() });
    render(<CustomHeader {...props} />);
    const nameField = screen.getByPlaceholderText("X-Custom-Header");

    userEvent.type(nameField, "X");

    expect(props.onChange).toHaveBeenCalledWith({ ...props.header, name: "X" });
  });

  it("should call `onChange` when user types in header value field", () => {
    const props = getProps({ onChange: jest.fn() });
    render(<CustomHeader {...props} />);
    const valueField = screen.getByPlaceholderText("Header value");

    userEvent.type(valueField, "V");

    expect(props.onChange).toHaveBeenCalledWith({
      ...props.header,
      value: "V",
    });
  });

  it("should call `onBlur` when user blurs from header name field", () => {
    const props = getProps({ onBlur: jest.fn() });
    render(<CustomHeader {...props} />);
    const nameField = screen.getByPlaceholderText("X-Custom-Header");

    userEvent.type(nameField, "X-Test-Test");
    nameField.blur();

    expect(props.onBlur).toHaveBeenCalledTimes(1);
  });

  it("should call `onBlur` when user blurs from header value field", () => {
    const props = getProps({ onBlur: jest.fn() });
    render(<CustomHeader {...props} />);
    const valueField = screen.getByPlaceholderText("Header value");

    userEvent.type(valueField, "Value");
    valueField.blur();

    expect(props.onBlur).toHaveBeenCalledTimes(1);
  });

  it("should render header value as configured when header value is configured", () => {
    const props = getProps({ header: { configured: true } });
    render(<CustomHeader {...props} />);
    const valueField = screen.getByPlaceholderText("Header value");

    expect(valueField).toHaveValue("configured");
    expect(valueField).toBeDisabled();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("should call `onChange` correctly when header value is configured and user clicks Reset button", () => {
    const props = getProps({
      header: { name: "X-Test", value: "Value", configured: true },
      onChange: jest.fn(),
    });
    render(<CustomHeader {...props} />);

    userEvent.click(screen.getByText("Reset"));

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith({
      ...props.header,
      value: "",
      configured: false,
    });
  });

  it("should not call `onChange` when in read only mode with header value configured and user clicks Reset button", () => {
    const props = getProps({
      header: { name: "X-Test", value: "Value", configured: true },
      onChange: jest.fn(),
      readOnly: true,
    });
    render(<CustomHeader {...props} />);

    userEvent.click(screen.getByText("Reset"));

    expect(props.onChange).not.toHaveBeenCalled();
  });

  it("should render remove header button", () => {
    render(<CustomHeader {...getProps()} />);

    expect(screen.getByLabelText("Remove header")).toBeInTheDocument();
  });

  it("should call `onDelete` when user clicks remove header button", () => {
    const props = getProps({ onDelete: jest.fn() });
    render(<CustomHeader {...props} />);

    userEvent.click(screen.getByLabelText("Remove header"));

    expect(props.onDelete).toHaveBeenCalledTimes(1);
  });

  it("should have remove header button disabled when in read only mode", () => {
    const props = getProps({ readOnly: true });
    render(<CustomHeader {...props} />);

    expect(screen.getByLabelText("Remove header")).toBeDisabled();
  });
});
