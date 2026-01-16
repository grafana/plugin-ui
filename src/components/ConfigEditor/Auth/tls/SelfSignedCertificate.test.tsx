import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SelfSignedCertificate, type Props } from './SelfSignedCertificate';

const getProps = (partialProps?: Partial<Props>): Props => ({
  enabled: false,
  onToggle: jest.fn(),
  certificateConfigured: false,
  onCertificateChange: jest.fn(),
  onCertificateReset: jest.fn(),
  readOnly: false,
  ...partialProps,
});

describe('<SelfSignedCertificate />', () => {
  it('should render', () => {
    render(<SelfSignedCertificate {...getProps()} />);
  });

  it('should call `onToggle` when checkbox is clicked', async () => {
    const props = getProps({ onToggle: jest.fn() });
    render(<SelfSignedCertificate {...props} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });

  it('should have checkbox disabled when in read only mode', () => {
    const props = getProps({ readOnly: true });
    render(<SelfSignedCertificate {...props} />);

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });

  it('should have CA certificate field when enabled', () => {
    const props = getProps({ enabled: true });
    render(<SelfSignedCertificate {...props} />);

    expect(screen.getByLabelText('CA Certificate *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Begins with --- BEGIN CERTIFICATE ---')).toBeInTheDocument();
  });

  it('should call `onCertificateChange` when user types in the certificate field', async () => {
    const props = getProps({ enabled: true, onCertificateChange: jest.fn() });
    render(<SelfSignedCertificate {...props} />);
    const input = screen.getByPlaceholderText('Begins with --- BEGIN CERTIFICATE ---');

    await userEvent.type(input, 'Something');

    expect(props.onCertificateChange).toHaveBeenCalledWith('Something');
  });

  it('should render certificate as configured when certificate is configured', () => {
    const props = getProps({ enabled: true, certificateConfigured: true });
    render(<SelfSignedCertificate {...props} />);
    const input = screen.getByPlaceholderText('Begins with --- BEGIN CERTIFICATE ---');

    expect(input).toHaveValue('configured');
    expect(input).toBeDisabled();
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should call `onCertificateReset` when certificate configured and Reset button is clicked', async () => {
    const props = getProps({
      enabled: true,
      certificateConfigured: true,
      onCertificateReset: jest.fn(),
    });
    render(<SelfSignedCertificate {...props} />);

    await userEvent.click(screen.getByText('Reset'));

    expect(props.onCertificateReset).toHaveBeenCalledTimes(1);
  });

  it('should not call `onCertificateReset` when in read only mode with certificate configured and `Reset` button is clicked', async () => {
    const props = getProps({
      enabled: true,
      certificateConfigured: true,
      onCertificateReset: jest.fn(),
      readOnly: true,
    });
    render(<SelfSignedCertificate {...props} />);

    await userEvent.click(screen.getByText('Reset'));

    expect(props.onCertificateReset).not.toHaveBeenCalled();
  });
});
