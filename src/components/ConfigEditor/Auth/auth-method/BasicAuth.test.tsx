import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BasicAuth, type Props } from './BasicAuth';

const getProps = (partialProps?: Partial<Props>): Props => ({
  passwordConfigured: false,
  onUserChange: jest.fn(),
  onPasswordChange: jest.fn(),
  onPasswordReset: jest.fn(),
  readOnly: false,
  ...partialProps,
});

describe('<BasicAuth />', () => {
  it('should render user and password fields', async () => {
    render(<BasicAuth {...getProps()} />);

    expect(screen.getByLabelText('User *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('User')).toBeInTheDocument();
    expect(screen.getByLabelText('Password *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
  });

  it('should render user value when user is passed', async () => {
    const props = getProps({ user: 'test-username' });
    render(<BasicAuth {...props} />);

    expect(screen.getByPlaceholderText('User')).toHaveValue('test-username');
  });

  it('should render password as configured when password is configured', async () => {
    const props = getProps({ passwordConfigured: true });
    render(<BasicAuth {...props} />);
    const passwordField = screen.getByPlaceholderText('Password');

    expect(passwordField).toBeDisabled();
    expect(passwordField).toHaveValue('configured');
    expect(screen.getByText('Reset')).toBeInTheDocument();
  });

  it('should call `onUserChange` when user types in the user input', async () => {
    const props = getProps({ onUserChange: jest.fn() });
    const user = userEvent.setup();
    render(<BasicAuth {...props} />);
    const userField = screen.getByPlaceholderText('User');

    await user.type(userField, 'X');

    expect(props.onUserChange).toHaveBeenCalledTimes(1);
    expect(props.onUserChange).toHaveBeenCalledWith('X');
  });

  it('should call `onPasswordChange` when user types in the password input', async () => {
    const props = getProps({ onPasswordChange: jest.fn() });
    const user = userEvent.setup();
    render(<BasicAuth {...props} />);
    const passwordField = screen.getByPlaceholderText('Password');

    await user.type(passwordField, '&');

    expect(props.onPasswordChange).toHaveBeenCalledTimes(1);
    expect(props.onPasswordChange).toHaveBeenCalledWith('&');
  });

  it('should call `onPasswordReset` when user resets password', async () => {
    const props = getProps({
      passwordConfigured: true,
      onPasswordReset: jest.fn(),
    });
    const user = userEvent.setup();
    render(<BasicAuth {...props} />);

    await user.click(screen.getByText('Reset'));

    expect(props.onPasswordReset).toHaveBeenCalledTimes(1);
  });

  it('should render as disabled in read only mode', async () => {
    const props = getProps({ readOnly: true });
    render(<BasicAuth {...props} />);

    expect(screen.getByPlaceholderText('User')).toBeDisabled();
    expect(screen.getByPlaceholderText('Password')).toBeDisabled();
  });

  it('should render custom username and password labels and placeholders', () => {
    const props = getProps({
      userLabel: 'user-test-label',
      userPlaceholder: 'user-test-placeholder',
      passwordLabel: 'pwd-test-label',
      passwordPlaceholder: 'pwd-test-placeholder',
    });
    render(<BasicAuth {...props} />);

    expect(screen.getByLabelText('user-test-label *')).toHaveAttribute('placeholder', 'user-test-placeholder');
    expect(screen.getByLabelText('pwd-test-label *')).toHaveAttribute('placeholder', 'pwd-test-placeholder');
  });
});
