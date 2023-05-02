import React from "react";
import { screen, render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthMethodSettings, Props } from "./AuthMethodSettings";
import { AuthMethod } from "../types";

type PartialProps = Partial<
  Omit<Props, "basicAuth"> & { basicAuth?: Partial<Props["basicAuth"]> }
>;
const getProps = (partialProps?: PartialProps): Props => ({
  selectedMethod: AuthMethod.NoAuth,
  onAuthMethodSelect: jest.fn(),
  readOnly: false,
  ...partialProps,
  basicAuth: {
    passwordConfigured: false,
    onUserChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onPasswordReset: jest.fn(),
    ...partialProps?.basicAuth,
  },
});

describe("<AuthMethodSettings />", () => {
  it("should render selected method when select box is closed", () => {
    const props = getProps({ selectedMethod: AuthMethod.BasicAuth });
    render(<AuthMethodSettings {...props} />);

    expect(screen.getByText("Basic authentication")).toBeInTheDocument();
    expect(() => screen.getByText("Forward OAuth Identity")).toThrow();
    expect(() => screen.getByText("No Authentication")).toThrow();
  });

  it("should render all default available auth methods when select is open", () => {
    const props = getProps();
    render(<AuthMethodSettings {...props} />);

    openSelect();

    const selectOptionsMenu = screen.getByLabelText("Select options menu");
    expect(screen.getAllByLabelText("Select option")).toHaveLength(3);
    expect(
      within(selectOptionsMenu).getByText("Basic authentication")
    ).toBeInTheDocument();
    expect(
      within(selectOptionsMenu).getByText("Forward OAuth Identity")
    ).toBeInTheDocument();
    expect(
      within(selectOptionsMenu).getByText("No Authentication")
    ).toBeInTheDocument();
  });

  it("should render only passed visible methods in the correct order when select is open", () => {
    const props = getProps({
      visibleMethods: [AuthMethod.CrossSiteCredentials, AuthMethod.NoAuth],
    });
    render(<AuthMethodSettings {...props} />);

    openSelect();

    const allOptions = screen.getAllByLabelText("Select option");
    expect(allOptions).toHaveLength(2);
    expect(
      within(allOptions[0]).getByText(
        "Enable cross-site access control requests"
      )
    ).toBeInTheDocument();
    expect(
      within(allOptions[1]).getByText("No Authentication")
    ).toBeInTheDocument();
    expect(() => screen.getByText("Basic Authentication")).toThrow();
    expect(() => screen.getByText("Forward OAuth Identity")).toThrow();
  });

  it("should have most common auth method preselected", () => {
    const props = getProps({ mostCommonMethod: AuthMethod.BasicAuth });
    render(<AuthMethodSettings {...props} />);

    expect(() => screen.getByText("Basic authentication")).toThrow();
    expect(
      screen.getByText("Basic authentication (most common)")
    ).toBeInTheDocument();
  });

  it("should render most common label for the option in the list", () => {
    const props = getProps({ mostCommonMethod: AuthMethod.BasicAuth });
    render(<AuthMethodSettings {...props} />);

    openSelect();

    const selectOptions = screen.getByLabelText("Select options menu");
    expect(() => screen.getByText("Basic authentication")).toThrow();
    expect(
      within(selectOptions).getByText("Basic authentication (most common)")
    ).toBeInTheDocument();
  });

  it("should be disabled when in read only mode", () => {
    const props = getProps({
      selectedMethod: AuthMethod.BasicAuth,
      readOnly: true,
    });
    render(<AuthMethodSettings {...props} />);

    // For some reason screen.getByRole("combobox") doesn't work for disabled select
    const select = screen.getAllByDisplayValue("")[0];
    expect(select.getAttribute("role")).toBe("combobox");
    expect(select).toBeDisabled();
    expect(screen.getByPlaceholderText("User")).toBeDisabled();
    expect(screen.getByPlaceholderText("Password")).toBeDisabled();
  });

  it("should call `onAuthMethodSelect` when default auth method is selected", () => {
    const props = getProps({ onAuthMethodSelect: jest.fn() });
    render(<AuthMethodSettings {...props} />);

    openSelect();
    userEvent.click(screen.getByText("Basic authentication"));

    expect(props.onAuthMethodSelect).toHaveBeenCalledTimes(1);
    expect(props.onAuthMethodSelect).toHaveBeenCalledWith(AuthMethod.BasicAuth);
  });

  it("should call `onAuthMethodSelect` when custom auth method is selected", () => {
    const props = getProps({
      onAuthMethodSelect: jest.fn(),
      customMethods: [
        {
          id: "custom-test",
          label: "Custom method label",
          description: "Custom method description",
          component: <div>Custom method fields</div>,
        },
      ],
    });
    render(<AuthMethodSettings {...props} />);

    openSelect();
    userEvent.click(screen.getByText("Custom method label"));

    expect(props.onAuthMethodSelect).toHaveBeenCalledTimes(1);
    expect(props.onAuthMethodSelect).toHaveBeenCalledWith("custom-test");
  });

  it("should render custom auth method in the options list", () => {
    const props = getProps({
      customMethods: [
        {
          id: "custom-test",
          label: "Custom method label",
          description: "Custom method description",
          component: <div>Custom method fields</div>,
        },
      ],
    });
    render(<AuthMethodSettings {...props} />);

    openSelect();
    const selectOptionsMenu = screen.getByLabelText("Select options menu");

    expect(
      within(selectOptionsMenu).getByText("Custom method label")
    ).toBeInTheDocument();
    expect(
      within(selectOptionsMenu).getByText("Custom method description")
    ).toBeInTheDocument();
  });

  it("should show corresponding fields for the selected auth method", () => {
    const props = getProps({
      customMethods: [
        {
          id: "custom-test",
          label: "Custom method label",
          description: "Custom method description",
          component: <div>Custom method fields</div>,
        },
      ],
    });
    const { rerender } = render(<AuthMethodSettings {...props} />);

    expect(() => screen.getByText("Custom method fields")).toThrow();
    expect(() => screen.getByLabelText("User *")).toThrow();

    let newProps: Props = { ...props, selectedMethod: AuthMethod.BasicAuth };
    rerender(<AuthMethodSettings {...newProps} />);

    expect(() => screen.getByText("Custom method fields")).toThrow();
    expect(screen.getByLabelText("User *")).toBeInTheDocument();

    newProps = { ...props, selectedMethod: "custom-test" };
    rerender(<AuthMethodSettings {...newProps} />);

    expect(screen.getByText("Custom method fields")).toBeInTheDocument();
    expect(() => screen.getByLabelText("User *")).toThrow();
  });

  it("should not render select when only single auth method is visible", () => {
    const props = getProps({ visibleMethods: [AuthMethod.BasicAuth] });
    render(<AuthMethodSettings {...props} />);

    expect(() => screen.getByRole("combobox")).toThrow();
    expect(screen.getByText("Basic authentication")).toBeInTheDocument();
    expect(screen.getByLabelText("User *")).toBeInTheDocument();
  });
});

function openSelect() {
  userEvent.click(screen.getByRole("combobox"));
}
