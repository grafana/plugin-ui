import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SkipTLSVerification, Props } from './SkipTLSVerification';

const getProps = (partialProps?: Partial<Props>): Props => ({
  enabled: false,
  onToggle: jest.fn(),
  readOnly: false,
  ...partialProps,
});

describe('<SkipTLSVerification />', () => {
  it('should render', () => {
    render(<SkipTLSVerification {...getProps()} />);
  });

  it('should call `onToggle` when checkbox is clicked', async () => {
    const props = getProps({ onToggle: jest.fn() });
    render(<SkipTLSVerification {...props} />);

    await userEvent.click(screen.getByRole('checkbox'));

    expect(props.onToggle).toHaveBeenCalledTimes(1);
  });
});
