import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConnectionSettings, type Props } from './ConnectionSettings';
import { type Config } from '../types';

const getProps = (partialProps?: Partial<Props>): Props => ({
  config: {
    url: '',
  } as Config,
  onChange: () => {},
  description: undefined,
  urlPlaceholder: undefined,
  urlTooltip: undefined,
  urlLabel: undefined,
  className: undefined,
  ...partialProps,
});

describe('<ConnectionSettings />', () => {
  it('should render url field', () => {
    const props = getProps();
    render(<ConnectionSettings {...props} />);

    expect(screen.getByLabelText('URL *')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('URL')).toBeInTheDocument();
  });

  it('should render provided url', () => {
    const url = 'https://some.test.url';
    const props = getProps({
      config: { url } as Config,
    });
    render(<ConnectionSettings {...props} />);

    expect(screen.getByPlaceholderText('URL')).toHaveValue(url);
  });

  it('should render error when url is empty', () => {
    const props = getProps({ config: { url: '' } as Config });
    render(<ConnectionSettings {...props} />);

    expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
  });

  it('should render error when url is incorrect', () => {
    const props = getProps({
      config: { url: 'incorrect-url' } as Config,
    });
    render(<ConnectionSettings {...props} />);

    expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument();
  });

  it('should not render error when url is correct', () => {
    const props = getProps({
      config: { url: 'http://correct.url' } as Config,
    });
    render(<ConnectionSettings {...props} />);

    expect(() => screen.getByText('Please enter a valid URL')).toThrow();
  });

  it('should render url input as disabled when in read only mode', () => {
    const props = getProps({
      config: { readOnly: true } as Config,
    });
    render(<ConnectionSettings {...props} />);

    expect(screen.getByPlaceholderText('URL')).toBeDisabled();
  });

  it('should render description', () => {
    const description = 'Some test description';
    const props = getProps({ description });

    render(<ConnectionSettings {...props} />);

    expect(screen.getByText(description)).toBeInTheDocument();
  });

  it('should render custom placeholder', () => {
    const urlPlaceholder = 'Test placeholder';
    const props = getProps({ urlPlaceholder });

    render(<ConnectionSettings {...props} />);

    expect(screen.getByPlaceholderText(urlPlaceholder)).toBeInTheDocument();
  });

  it('should render custom tooltip', async () => {
    const urlTooltip = 'Test tooltip';
    const props = getProps({ urlTooltip });
    const user = userEvent.setup();

    render(<ConnectionSettings {...props} />);
    await user.hover(screen.getByTestId('info-circle'));

    expect(await screen.findByText(urlTooltip)).toBeInTheDocument();
  });

  it('should render custom label', () => {
    const urlLabel = 'Test label';
    const props = getProps({ urlLabel });

    render(<ConnectionSettings {...props} />);

    expect(screen.getByLabelText(`${urlLabel} *`)).toBeInTheDocument();
  });

  it('should render custom className', () => {
    const className = 'custom-class';
    const props = getProps({ className });

    const { container } = render(<ConnectionSettings {...props} />);

    expect(container.firstChild).toHaveClass(className);
  });

  it('should call onChange when user changes url', async () => {
    const onChange = jest.fn();
    const props = getProps({ onChange });
    const user = userEvent.setup();

    render(<ConnectionSettings {...props} />);
    const input = screen.getByPlaceholderText('URL');
    await user.type(input, 'X');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith({ url: 'X' });
  });
});
