import React from 'react';
import { screen, render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TLSSettingsSection, type Props } from './TLSSettingsSection';

const getProps = (partialProps?: Partial<Props>): Props => ({
  enabled: false,
  label: 'Default test label',
  tooltipText: 'Default test tooltip',
  onToggle: jest.fn,
  readOnly: false,
  ...partialProps,
});

describe('<TLSSettingsSection />', () => {
  it('should render label', () => {
    const props = getProps({ label: 'Test label' });
    render(<TLSSettingsSection {...props} />);

    expect(screen.getByText('Test label')).toBeInTheDocument();
  });

  it('should render tooltip', async () => {
    const props = getProps({ tooltipText: 'Test tooltip text' });
    render(<TLSSettingsSection {...props} />);

    await userEvent.hover(screen.getByTestId('info-circle'));

    expect(await screen.findByText('Test tooltip text')).toBeInTheDocument();
  });

  it('should call `onToggle` when checkbox is clicked', async () => {
    const onToggle = jest.fn();
    const props = getProps({ label: 'Test label', onToggle });
    const { rerender } = render(<TLSSettingsSection {...props} />);
    const checkbox = screen.getByRole('checkbox');

    await userEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(onToggle).toHaveBeenCalledWith(true);

    rerender(<TLSSettingsSection {...props} enabled />);
    await userEvent.click(checkbox);

    expect(onToggle).toHaveBeenCalledTimes(2);
    expect(onToggle).toHaveBeenNthCalledWith(2, false);
  });

  it('should not render content when not enabled', () => {
    const props = getProps();
    render(
      <TLSSettingsSection {...props}>
        <div>Test content</div>
      </TLSSettingsSection>
    );

    expect(() => screen.getByText('Test content')).toThrow();
  });

  it('should render content when enabled', () => {
    const props = getProps({ enabled: true });
    render(
      <TLSSettingsSection {...props}>
        <div>Test content</div>
      </TLSSettingsSection>
    );

    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('should have checkbox checked when enabled', () => {
    const props = getProps({ enabled: true });
    render(<TLSSettingsSection {...props} />);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('should have checkbox disabled when in read only mode', () => {
    const props = getProps({ readOnly: true });
    render(<TLSSettingsSection {...props} />);

    expect(screen.getByRole('checkbox')).toBeDisabled();
  });
});
