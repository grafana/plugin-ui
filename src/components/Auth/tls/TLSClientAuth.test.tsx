import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TLSClientAuth, Props } from "./TLSClientAuth";

const getProps = (partialProps?: Partial<Props>): Props => ({
  enabled: false,
  onToggle: jest.fn(),
  serverName: "",
  clientCertificateConfigured: false,
  clientKeyConfigured: false,
  onServerNameChange: jest.fn(),
  onClientCertificateChange: jest.fn(),
  onClientKeyChange: jest.fn(),
  onClientCertificateReset: jest.fn(),
  onClientKeyReset: jest.fn(),
  readOnly: false,
  ...partialProps,
});

describe("<TLSClientAuth />", () => {
  it("should render", () => {
    render(<TLSClientAuth {...getProps()} />);
  });

  it("should call `onToggle` when checkbox is clicked", () => {
    const props = getProps({ onToggle: jest.fn() });
    render(<TLSClientAuth {...props} />);

    userEvent.click(screen.getByRole("checkbox"));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it("should have checkbox disabled when in read only mode", () => {
    const props = getProps({ readOnly: true });
    render(<TLSClientAuth {...props} />);

    expect(screen.getByRole("checkbox")).toBeDisabled();
  });

  it("should have all necessary fields when enabled", () => {
    const props = getProps({ enabled: true });
    render(<TLSClientAuth {...props} />);

    expect(screen.getByLabelText("ServerName *")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("domain.example.com")
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Client Certificate *")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Begins with --- BEGIN CERTIFICATE ---")
    ).toBeInTheDocument();

    expect(screen.getByLabelText("Client Key *")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(
        "Begins with --- RSA PRIVATE KEY CERTIFICATE ---"
      )
    ).toBeInTheDocument();
  });

  it("should render server name value when server name is passed", () => {
    const props = getProps({ enabled: true, serverName: "some.test.com" });
    render(<TLSClientAuth {...props} />);

    expect(screen.getByDisplayValue("some.test.com")).toBeInTheDocument();
  });

  it("should call `onServerNameChange` when user types in server name field", () => {
    const props = getProps({
      enabled: true,
      serverName: "grafana",
      onServerNameChange: jest.fn(),
    });
    render(<TLSClientAuth {...props} />);
    const input = screen.getByPlaceholderText("domain.example.com");

    userEvent.type(input, ".");

    expect(props.onServerNameChange).toHaveBeenCalledWith("grafana.");
  });

  it("should call `onClientCertificateChange` when user types in the client certificate field", () => {
    const props = getProps({
      enabled: true,
      onClientCertificateChange: jest.fn(),
    });
    render(<TLSClientAuth {...props} />);
    const input = screen.getByPlaceholderText(
      "Begins with --- BEGIN CERTIFICATE ---"
    );

    userEvent.type(input, "Something");

    expect(props.onClientCertificateChange).toHaveBeenCalledWith("Something");
  });

  it("should render client certificate as configured when client certificate is configured", () => {
    const props = getProps({
      enabled: true,
      clientCertificateConfigured: true,
    });
    render(<TLSClientAuth {...props} />);
    const input = screen.getByPlaceholderText(
      "Begins with --- BEGIN CERTIFICATE ---"
    );

    expect(input).toHaveValue("configured");
    expect(input).toBeDisabled();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("should call `onClientCertificateReset` when client certificate is configured and Reset button is clicked", () => {
    const props = getProps({
      enabled: true,
      clientCertificateConfigured: true,
      onClientCertificateReset: jest.fn(),
    });
    render(<TLSClientAuth {...props} />);

    userEvent.click(screen.getByText("Reset"));

    expect(props.onClientCertificateReset).toHaveBeenCalledTimes(1);
  });

  it("should not call `onClientCertificateReset` when in read only mode with client certificate configured and `Reset` button is clicked", () => {
    const props = getProps({
      enabled: true,
      clientCertificateConfigured: true,
      onClientCertificateReset: jest.fn(),
      readOnly: true,
    });
    render(<TLSClientAuth {...props} />);

    userEvent.click(screen.getByText("Reset"));

    expect(props.onClientCertificateReset).not.toHaveBeenCalled();
  });

  it("should call `onClientKeyChange` when user types in the client key field", () => {
    const props = getProps({
      enabled: true,
      onClientKeyChange: jest.fn(),
    });
    render(<TLSClientAuth {...props} />);
    const input = screen.getByPlaceholderText(
      "Begins with --- RSA PRIVATE KEY CERTIFICATE ---"
    );

    userEvent.type(input, "Something");

    expect(props.onClientKeyChange).toHaveBeenCalledWith("Something");
  });

  it("should render client key as configured when client key is configured", () => {
    const props = getProps({
      enabled: true,
      clientKeyConfigured: true,
    });
    render(<TLSClientAuth {...props} />);
    const input = screen.getByPlaceholderText(
      "Begins with --- RSA PRIVATE KEY CERTIFICATE ---"
    );

    expect(input).toHaveValue("configured");
    expect(input).toBeDisabled();
    expect(screen.getByText("Reset")).toBeInTheDocument();
  });

  it("should call `onClientKeyReset` when client key is configured and Reset button is clicked", () => {
    const props = getProps({
      enabled: true,
      clientKeyConfigured: true,
      onClientKeyReset: jest.fn(),
    });
    render(<TLSClientAuth {...props} />);

    userEvent.click(screen.getByText("Reset"));

    expect(props.onClientKeyReset).toHaveBeenCalledTimes(1);
  });

  it("should not call `onClientKeyReset` when in read only mode with client key configured and `Reset` button is clicked", () => {
    const props = getProps({
      enabled: true,
      clientKeyConfigured: true,
      onClientKeyReset: jest.fn(),
      readOnly: true,
    });
    render(<TLSClientAuth {...props} />);

    userEvent.click(screen.getByText("Reset"));

    expect(props.onClientKeyReset).not.toHaveBeenCalled();
  });
});
