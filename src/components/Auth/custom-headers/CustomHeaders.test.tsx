import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CustomHeaders, Props } from "./CustomHeaders";

const getProps = (partialProps?: Partial<Props>): Props => ({
  headers: [],
  onChange: jest.fn(),
  readOnly: false,
  ...partialProps,
});

describe("<CustomHeaders />", () => {
  it("should render", () => {
    render(<CustomHeaders {...getProps()} />);
  });

  it("should be collapsed and expandable when there are no headers", () => {
    render(<CustomHeaders {...getProps({ headers: [] })} />);
    const expandBtn = screen.getByTestId("angle-down");

    expect(() => screen.getByText("Add header")).toThrow();

    userEvent.click(expandBtn);

    expect(screen.getByText("Add header")).toBeInTheDocument();
  });

  it("should have different add header button text for 0 headers and 1+ headers", () => {
    const props = getProps();
    render(<CustomHeaders {...props} />);
    const expandBtn = screen.getByTestId("angle-down");

    userEvent.click(expandBtn);

    expect(screen.getByText("Add header")).toBeInTheDocument();
    expect(() => screen.getByText("Add another header")).toThrow();

    userEvent.click(screen.getByText("Add header"));

    expect(screen.getByText("Add another header")).toBeInTheDocument();
    expect(() => screen.getByText("Add header")).toThrow();
  });

  it("should be expanded and render name and value fields when headers are passed", () => {
    const props = getProps({
      headers: [
        { name: "X-Name1", configured: false },
        { name: "X-Name2", configured: false },
      ],
    });
    render(<CustomHeaders {...props} />);
    const nameFields = screen.getAllByPlaceholderText("X-Custom-Header");
    const valueFields = screen.getAllByPlaceholderText("Header value");

    expect(nameFields).toHaveLength(2);
    expect(nameFields[0]).toHaveValue("X-Name1");
    expect(nameFields[1]).toHaveValue("X-Name2");
    expect(valueFields).toHaveLength(2);
    expect(valueFields[0]).toHaveValue("");
    expect(valueFields[1]).toHaveValue("");
  });

  it("should render configured headers as configured", () => {
    const props = getProps({
      headers: [
        { name: "X-Name1", configured: false },
        { name: "X-Name2", configured: true },
      ],
    });
    render(<CustomHeaders {...props} />);
    const [value1Field, value2Field] = screen.getAllByPlaceholderText(
      "Header value"
    );

    expect(value1Field).not.toBeDisabled();
    expect(value1Field).toHaveValue("");
    expect(value2Field).toBeDisabled();
    expect(value2Field).toHaveValue("configured");
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("should change header state to configured when was not configured and rerendered as configured", () => {
    const props = getProps({
      headers: [
        { name: "X-Name1", configured: false },
        { name: "X-Name2", configured: false },
      ],
    });
    const { rerender } = render(<CustomHeaders {...props} />);
    let [value1Field, value2Field] = screen.getAllByPlaceholderText(
      "Header value"
    );

    expect(value1Field).not.toBeDisabled();
    expect(value1Field).toHaveValue("");
    expect(value2Field).not.toBeDisabled();
    expect(value2Field).toHaveValue("");
    expect(() => screen.getByText("Reset")).toThrow();

    const newProps = getProps({
      headers: [
        { name: "X-Name1", configured: false },
        { name: "X-Name2", configured: true },
      ],
    });
    rerender(<CustomHeaders {...newProps} />);
    [value1Field, value2Field] = screen.getAllByPlaceholderText("Header value");

    expect(value1Field).not.toBeDisabled();
    expect(value1Field).toHaveValue("");
    expect(value2Field).toBeDisabled();
    expect(value2Field).toHaveValue("configured");
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("should add a new header when user clicks add header button", () => {
    const props = getProps({
      onChange: jest.fn(),
      headers: [{ name: "X-Name", configured: false }],
    });
    render(<CustomHeaders {...props} />);
    const addHeaderBtn = screen.getByText("Add another header");

    expect(screen.getAllByPlaceholderText("X-Custom-Header")).toHaveLength(1);
    expect(screen.getAllByPlaceholderText("Header value")).toHaveLength(1);

    userEvent.click(addHeaderBtn);

    expect(screen.getAllByPlaceholderText("X-Custom-Header")).toHaveLength(2);
    expect(screen.getAllByPlaceholderText("Header value")).toHaveLength(2);
  });

  it("should call `onChange` when user adds new header and types something in there and blurs", () => {
    const props = getProps({
      onChange: jest.fn(),
      headers: [{ name: "X-Name1", configured: false }],
    });
    render(<CustomHeaders {...props} />);
    const addHeaderBtn = screen.getByText("Add another header");

    userEvent.click(addHeaderBtn);
    const name2Field = screen.getAllByPlaceholderText("X-Custom-Header")[1];
    userEvent.type(name2Field, "X-Name2");
    name2Field.blur();

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([
      { name: "X-Name1", value: "", configured: false },
      { name: "X-Name2", value: "", configured: false },
    ]);
  });

  it("should call `onChange` when user types in header name field and blurs", () => {
    const props = getProps({
      headers: [{ name: "X-Test", configured: false }],
      onChange: jest.fn(),
    });
    render(<CustomHeaders {...props} />);
    const nameField = screen.getByPlaceholderText("X-Custom-Header");

    userEvent.type(nameField, "-Header");
    nameField.blur();

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([
      { name: "X-Test-Header", value: "", configured: false },
    ]);
  });

  it("should call `onChange` when user types in header value field and blurs", () => {
    const props = getProps({
      headers: [{ name: "X-Test", configured: false }],
      onChange: jest.fn(),
    });
    render(<CustomHeaders {...props} />);
    const valueField = screen.getByPlaceholderText("Header value");

    userEvent.type(valueField, "TestValue");
    valueField.blur();

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([
      { name: "X-Test", value: "TestValue", configured: false },
    ]);
  });

  it("should call `onChange` when user resets configured header and types new value and blurs", () => {
    const props = getProps({
      headers: [
        { name: "X-Test1", configured: false },
        { name: "X-Test2", configured: true },
      ],
      onChange: jest.fn(),
    });
    render(<CustomHeaders {...props} />);

    userEvent.click(screen.getByText("Reset"));
    const value2Field = screen.getAllByPlaceholderText("Header value")[1];
    userEvent.type(value2Field, "newValue");
    value2Field.blur();

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([
      { name: "X-Test1", value: "", configured: false },
      { name: "X-Test2", value: "newValue", configured: false },
    ]);
  });

  it("should call `onChange` when user removes header", () => {
    const props = getProps({
      headers: [
        { name: "X-Test1", configured: true },
        { name: "X-Test2", configured: false },
      ],
      onChange: jest.fn(),
    });
    render(<CustomHeaders {...props} />);

    userEvent.click(screen.getAllByLabelText("Remove header")[1]);

    expect(props.onChange).toHaveBeenCalledTimes(1);
    expect(props.onChange).toHaveBeenCalledWith([
      { name: "X-Test1", value: "", configured: true },
    ]);
  });

  it("should have inputs and buttons disabled when in read only mode", () => {
    const props = getProps({
      headers: [{ name: "X-Name", configured: false }],
      readOnly: true,
    });
    render(<CustomHeaders {...props} />);
    const addHeaderBtn = screen
      .getByText("Add another header")
      .closest("button");
    const removeHeaderBtn = screen.getByLabelText("Remove header");
    const nameField = screen.getByPlaceholderText("X-Custom-Header");
    const valueField = screen.getByPlaceholderText("Header value");

    expect(addHeaderBtn).toBeDisabled();
    expect(removeHeaderBtn).toBeDisabled();
    expect(nameField).toBeDisabled();
    expect(valueField).toBeDisabled();
  });
});
