import { screen, render } from '@testing-library/react';
import { Auth, type Props } from './Auth';
import { AuthMethod } from './types';

const getProps = (partialProps?: Partial<Props>): Props => ({
  selectedMethod: AuthMethod.BasicAuth,
  onAuthMethodSelect: jest.fn(),
  basicAuth: {
    passwordConfigured: false,
    onUserChange: jest.fn(),
    onPasswordChange: jest.fn(),
    onPasswordReset: jest.fn(),
    ...partialProps?.basicAuth,
  },
  TLS: {
    selfSignedCertificate: {
      enabled: false,
      onToggle: jest.fn(),
      certificateConfigured: false,
      onCertificateChange: jest.fn(),
      onCertificateReset: jest.fn(),
      ...partialProps?.TLS?.selfSignedCertificate,
    },
    TLSClientAuth: {
      enabled: false,
      onToggle: jest.fn(),
      serverName: '',
      clientCertificateConfigured: false,
      clientKeyConfigured: false,
      onServerNameChange: jest.fn(),
      onClientCertificateChange: jest.fn(),
      onClientKeyChange: jest.fn(),
      onClientCertificateReset: jest.fn(),
      onClientKeyReset: jest.fn(),
      ...partialProps?.TLS?.TLSClientAuth,
    },
    skipTLSVerification: {
      enabled: false,
      onToggle: jest.fn(),
      ...partialProps?.TLS?.skipTLSVerification,
    },
  },
  customHeaders: {
    headers: [],
    onChange: jest.fn(),
    ...partialProps?.customHeaders,
  },
});

describe('<Auth />', () => {
  it('should render auth method selector', () => {
    render(<Auth {...getProps()} />);

    expect(screen.getByText('Authentication methods')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('should render TLS settings', () => {
    render(<Auth {...getProps()} />);

    expect(screen.getByText('TLS settings')).toBeInTheDocument();
  });

  it('should render custom headers settings', () => {
    render(<Auth {...getProps()} />);

    expect(screen.getByText('HTTP headers')).toBeInTheDocument();
  });
});
