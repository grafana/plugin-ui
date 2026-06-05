import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { type DataQuery } from '@grafana/data';
import { RunQueryButtons, type RunQueryButtonsProps } from './RunQueryButtons';

const getDefaultProps = (overrides?: Partial<RunQueryButtonsProps<DataQuery>>) => {
  return {
    onRunQuery: jest.fn(),
    onCancelQuery: jest.fn(),
    enableRun: true,
    query: { refId: 'refId' },
    ...overrides,
  };
};

describe('RunQueryButtons', () => {
  it('renders the `Run` and `Stop` buttons', () => {
    const props = getDefaultProps();
    render(<RunQueryButtons {...props} />);
    const runButton = screen.getByRole('button', { name: 'Run query' });
    expect(runButton).toBeInTheDocument();
    const stopButton = screen.queryByRole('button', { name: 'Stop query' });
    expect(stopButton).toBeInTheDocument();
  });

  it('disable the run button if the if the enableRun button is false', () => {
    const props = getDefaultProps({ enableRun: false });
    render(<RunQueryButtons {...props} />);
    const runButton = screen.getByRole('button', { name: 'Run query' });
    expect(runButton).toBeDisabled();
  });

  it('run button should be enabled if the enableRun button is true', () => {
    const props = getDefaultProps({ enableRun: true });
    render(<RunQueryButtons {...props} />);
    const runButton = screen.getByRole('button', { name: 'Run query' });
    expect(runButton).not.toBeDisabled();
  });

  it('Stop query button should be disabled until run button is clicked', () => {
    const props = getDefaultProps();
    render(<RunQueryButtons {...props} />);
    const runButton = screen.getByRole('button', { name: 'Run query' });
    const stopButton = screen.getByRole('button', { name: 'Stop query' });
    expect(stopButton).toBeInTheDocument();
    expect(stopButton).toBeDisabled();
    fireEvent.click(runButton);
    expect(stopButton).not.toBeDisabled();
  });
});
