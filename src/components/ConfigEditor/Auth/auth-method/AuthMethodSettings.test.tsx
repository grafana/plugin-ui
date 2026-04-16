import React from 'react';
import { screen, render, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthMethodSettings, type Props } from './AuthMethodSettings';
import { AuthMethod, type AuthMethodSelectOption } from '../types';

type PartialProps = Partial<Omit<Props, 'basicAuth'> & { basicAuth?: Partial<Props['basicAuth']> }>;
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

describe('<AuthMethodSettings />', () => {
  it('should render selected method when select box is closed', async () => {
    const props = getProps({ selectedMethod: AuthMethod.BasicAuth });
    render(<AuthMethodSettings {...props} />);

    expect(screen.getByText('Basic authentication')).toBeInTheDocument();
    expect(() => screen.getByText('Forward OAuth Identity')).toThrow();
    expect(() => screen.getByText('No Authentication')).toThrow();
  });

  it('should override Basic auth name and display it', async () => {
    const props = getProps({
      selectedMethod: AuthMethod.BasicAuth,
      defaultOptionsOverrides: { [AuthMethod.BasicAuth]: { label: 'Override ' } } as Record<
        AuthMethod,
        AuthMethodSelectOption
      >,
    });
    render(<AuthMethodSettings {...props} />);

    expect(screen.getByText('Override')).toBeInTheDocument();
  });

  it('should render all default available auth methods when select is open', async () => {
    const props = getProps();
    const user = userEvent.setup();
    render(<AuthMethodSettings {...props} />);

    await openSelect(user);

    const selectOptionsMenu = screen.getByLabelText('Select options menu');
    expect(screen.getAllByLabelText('Select option')).toHaveLength(3);
    expect(within(selectOptionsMenu).getByText('Basic authentication')).toBeInTheDocument();
    expect(within(selectOptionsMenu).getByText('Forward OAuth Identity')).toBeInTheDocument();
    expect(within(selectOptionsMenu).getByText('No Authentication')).toBeInTheDocument();
  });

  it('should render only passed visible methods in the correct order when select is open', async () => {
    const props = getProps({
      visibleMethods: [AuthMethod.CrossSiteCredentials, AuthMethod.NoAuth],
    });
    const user = userEvent.setup();
    render(<AuthMethodSettings {...props} />);

    await openSelect(user);

    const allOptions = screen.getAllByLabelText('Select option');
    expect(allOptions).toHaveLength(2);
    expect(within(allOptions[0]).getByText('Enable cross-site access control requests')).toBeInTheDocument();
    expect(within(allOptions[1]).getByText('No Authentication')).toBeInTheDocument();
    expect(() => screen.getByText('Basic Authentication')).toThrow();
    expect(() => screen.getByText('Forward OAuth Identity')).toThrow();
  });

  it('should have most common auth method preselected', async () => {
    const props = getProps({ mostCommonMethod: AuthMethod.BasicAuth });
    render(<AuthMethodSettings {...props} />);

    expect(() => screen.getByText('Basic authentication')).toThrow();
    expect(screen.getByText('Basic authentication (most common)')).toBeInTheDocument();
  });

  it('should render most common label for the option in the list', async () => {
    const props = getProps({ mostCommonMethod: AuthMethod.BasicAuth });
    const user = userEvent.setup();
    render(<AuthMethodSettings {...props} />);

    await openSelect(user);

    const selectOptions = screen.getByLabelText('Select options menu');
    expect(() => screen.getByText('Basic authentication')).toThrow();
    expect(within(selectOptions).getByText('Basic authentication (most common)')).toBeInTheDocument();
  });

  it('should be disabled when in read only mode', async () => {
    const props = getProps({
      selectedMethod: AuthMethod.BasicAuth,
      readOnly: true,
    });
    render(<AuthMethodSettings {...props} />);

    // For some reason screen.getByRole("combobox") doesn't work for disabled select
    const select = screen.getAllByDisplayValue('')[0];
    expect(select.getAttribute('role')).toBe('combobox');
    expect(select).toBeDisabled();
    expect(screen.getByPlaceholderText('User')).toBeDisabled();
    expect(screen.getByPlaceholderText('Password')).toBeDisabled();
  });

  it('should call `onAuthMethodSelect` when default auth method is selected', async () => {
    const props = getProps({ onAuthMethodSelect: jest.fn() });
    const user = userEvent.setup();
    render(<AuthMethodSettings {...props} />);

    await openSelect(user);
    await user.click(screen.getByText('Basic authentication'));

    expect(props.onAuthMethodSelect).toHaveBeenCalledTimes(1);
    expect(props.onAuthMethodSelect).toHaveBeenCalledWith(AuthMethod.BasicAuth);
  });

  it('should call `onAuthMethodSelect` when custom auth method is selected', async () => {
    const props = getProps({
      onAuthMethodSelect: jest.fn(),
      customMethods: [
        {
          id: 'custom-test',
          label: 'Custom method label',
          description: 'Custom method description',
          component: <div>Custom method fields</div>,
        },
      ],
    });
    const user = userEvent.setup();
    render(<AuthMethodSettings {...props} />);

    await openSelect(user);
    await user.click(screen.getByText('Custom method label'));

    expect(props.onAuthMethodSelect).toHaveBeenCalledTimes(1);
    expect(props.onAuthMethodSelect).toHaveBeenCalledWith('custom-test');
  });

  it('should render custom auth method in the options list', async () => {
    const props = getProps({
      customMethods: [
        {
          id: 'custom-test',
          label: 'Custom method label',
          description: 'Custom method description',
          component: <div>Custom method fields</div>,
        },
      ],
    });
    const user = userEvent.setup();
    render(<AuthMethodSettings {...props} />);

    await openSelect(user);
    const selectOptionsMenu = screen.getByLabelText('Select options menu');

    expect(within(selectOptionsMenu).getByText('Custom method label')).toBeInTheDocument();
    expect(within(selectOptionsMenu).getByText('Custom method description')).toBeInTheDocument();
  });

  it('should show corresponding fields for the selected auth method', async () => {
    const props = getProps({
      customMethods: [
        {
          id: 'custom-test',
          label: 'Custom method label',
          description: 'Custom method description',
          component: <div>Custom method fields</div>,
        },
      ],
    });
    const { rerender } = render(<AuthMethodSettings {...props} />);

    expect(() => screen.getByText('Custom method fields')).toThrow();
    expect(() => screen.getByLabelText('User *')).toThrow();

    let newProps: Props = { ...props, selectedMethod: AuthMethod.BasicAuth };
    rerender(<AuthMethodSettings {...newProps} />);

    expect(() => screen.getByText('Custom method fields')).toThrow();
    expect(screen.getByLabelText('User *')).toBeInTheDocument();

    newProps = { ...props, selectedMethod: 'custom-test' };
    rerender(<AuthMethodSettings {...newProps} />);

    expect(screen.getByText('Custom method fields')).toBeInTheDocument();
    expect(() => screen.getByLabelText('User *')).toThrow();
  });

  it('should not render select when only single auth method is visible', async () => {
    const props = getProps({ visibleMethods: [AuthMethod.BasicAuth] });
    render(<AuthMethodSettings {...props} />);

    expect(() => screen.getByRole('combobox')).toThrow();
    expect(screen.getByText('Basic authentication')).toBeInTheDocument();
    expect(screen.getByLabelText('User *')).toBeInTheDocument();
  });
});

async function openSelect(user: ReturnType<(typeof userEvent)['setup']>) {
  await user.click(screen.getByRole('combobox'));
}
