import React from "react";
import { screen, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TLSSettings, Props } from "./TLSSettings";

type PartialProps = Partial<
  Omit<
    Props,
    "selfSignedCertificate" | "TLSClientAuth" | "skipTLSVerification"
  > & {
    selfSignedCertificate: Partial<Props["selfSignedCertificate"]>;
    TLSClientAuth: Partial<Props["TLSClientAuth"]>;
    skipTLSVerification: Partial<Props["skipTLSVerification"]>;
  }
>;

const getProps = (partialProps?: PartialProps): Props => ({
  readOnly: false,
  ...partialProps,
  selfSignedCertificate: {
    enabled: false,
    onToggle: jest.fn(),
    certificateConfigured: false,
    onCertificateChange: jest.fn(),
    onCertificateReset: jest.fn(),
    ...partialProps?.selfSignedCertificate,
  },
  TLSClientAuth: {
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
    ...partialProps?.TLSClientAuth,
  },
  skipTLSVerification: {
    enabled: false,
    onToggle: jest.fn(),
    ...partialProps?.skipTLSVerification,
  },
});

describe("<TLSSettings />", () => {
  it("should render all sections", () => {
    render(<TLSSettings {...getProps()} />);

    expect(screen.getAllByRole("checkbox")).toHaveLength(3);
    expect(screen.getByText("Add self-signed certificate")).toBeInTheDocument();
    expect(screen.getByText("TLS Client Authentication")).toBeInTheDocument();
    expect(
      screen.getByText("Skip TLS certificate validation")
    ).toBeInTheDocument();
  });

  it("should render checkboxes as disabled when in read only mode", () => {
    const props = getProps({ readOnly: true });
    render(<TLSSettings {...props} />);
    const checkboxes = screen.getAllByRole("checkbox");

    expect(checkboxes[0]).toBeDisabled();
    expect(checkboxes[1]).toBeDisabled();
    expect(checkboxes[2]).toBeDisabled();
  });
});
