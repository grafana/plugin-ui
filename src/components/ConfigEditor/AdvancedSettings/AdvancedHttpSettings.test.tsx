import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdvancedHttpSettings, Props } from './AdvancedHttpSettings';
import { Config } from '../types';

const getProps = (partialProps?: Partial<Props>): Props => ({
  config: {
    jsonData: {
      keepCookies: [],
      timeout: 0,
      ...partialProps?.config?.jsonData,
    },
    ...partialProps?.config,
  } as Config,
  onChange: () => {},
  ...partialProps,
});

describe('<AdvancedHttpSettings />', () => {
  it('should render cookies and timeout fields', () => {
    const props = getProps();

    render(<AdvancedHttpSettings {...props} />);

    expect(screen.getByLabelText('Allowed cookies')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('New cookie (hit enter to add)')).toBeInTheDocument();
    expect(screen.getByLabelText('Timeout')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Timeout in seconds')).toBeInTheDocument();
  });

  it('should render provided cookies', () => {
    const props = getProps({
      config: { jsonData: { keepCookies: ['test-cookie-1', 'test-cookie-2'] } } as Config,
    });

    render(<AdvancedHttpSettings {...props} />);

    expect(screen.getByText('test-cookie-1')).toBeInTheDocument();
    expect(screen.getByText('test-cookie-2')).toBeInTheDocument();
  });

  it('should render provided timeout', () => {
    const props = getProps({
      config: { jsonData: { timeout: 777 } } as Config,
    });

    render(<AdvancedHttpSettings {...props} />);

    expect(screen.getByPlaceholderText('Timeout in seconds')).toHaveValue(777);
  });

  it('should call onChange when new cookie is added', async () => {
    const onChange = jest.fn();
    const props = getProps({
      config: { jsonData: { keepCookies: ['cookie-1'] } } as Config,
      onChange,
    });
    const user = userEvent.setup();

    render(<AdvancedHttpSettings {...props} />);
    const cookieInput = screen.getByPlaceholderText('New cookie (hit enter to add)');

    await user.type(cookieInput, 'cookie-2{enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ jsonData: { keepCookies: ['cookie-1', 'cookie-2'] } });
  });

  it('should call onChange when timeout changes', async () => {
    const onChange = jest.fn();
    const props = getProps({
      config: { jsonData: { timeout: 123 } } as Config,
      onChange,
    });
    const user = userEvent.setup();

    render(<AdvancedHttpSettings {...props} />);
    const timeoutInput = screen.getByPlaceholderText('Timeout in seconds');

    // Select everything and type 7
    await user.type(timeoutInput, '{Control>}A{/Control}7}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ jsonData: { timeout: 7 } });
  });

  it('should render inputs as disabled when in read only mode', () => {
    const props = getProps({ config: { readOnly: true, jsonData: {} } as Config });

    render(<AdvancedHttpSettings {...props} />);

    expect(screen.getByPlaceholderText('New cookie (hit enter to add)')).toBeDisabled();
    expect(screen.getByPlaceholderText('Timeout in seconds')).toBeDisabled();
  });
});
