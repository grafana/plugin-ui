import React from 'react';
import { render, screen } from '@testing-library/react';
import { openMenu, select } from 'react-select-event';
import { useDataSourceInstanceList, useDefaultDataSourceInstanceListItem } from '@grafana/plugin-compat/datasources';
import { DataSourcePicker } from './DataSourcePicker';

jest.mock('@grafana/plugin-compat/datasources', () => ({
  useDataSourceInstanceList: jest.fn(),
  useDefaultDataSourceInstanceListItem: jest.fn(),
}));

type DataSourceInstanceListItem = Parameters<typeof useDefaultDataSourceInstanceListItem>[0][number];

const useListMock = jest.mocked(useDataSourceInstanceList);
const useDefaultMock = jest.mocked(useDefaultDataSourceInstanceListItem);

const listItem = (uid: string, name: string): DataSourceInstanceListItem => ({
  uid,
  name,
  type: name.toLowerCase(),
  meta: {
    id: name.toLowerCase(),
    name,
    signature: 'internal',
    info: { logos: { small: `${name}.svg`, large: `${name}-large.svg` } },
  } as unknown as DataSourceInstanceListItem['meta'],
});

const prometheus = listItem('prom-uid', 'Prometheus');
const loki = listItem('loki-uid', 'Loki');

describe('DataSourcePicker', () => {
  beforeEach(() => {
    useListMock.mockReset();
    useDefaultMock.mockReset();
    useListMock.mockReturnValue({ isLoading: false, items: [prometheus, loki] });
    useDefaultMock.mockReturnValue({ isLoading: false, item: undefined });
  });

  it('shows the name of the current data source, looked up by uid', () => {
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(screen.getByText('Prometheus')).toBeInTheDocument();
  });

  it('shows the name of the current data source, looked up by name', () => {
    render(<DataSourcePicker current="Loki" onChange={jest.fn()} />);

    expect(screen.getByText('Loki')).toBeInTheDocument();
  });

  it('shows the default data source when current is not set', () => {
    useDefaultMock.mockReturnValue({ isLoading: false, item: loki });
    render(<DataSourcePicker onChange={jest.fn()} />);

    expect(screen.getByText('Loki')).toBeInTheDocument();
    expect(useDefaultMock).toHaveBeenLastCalledWith([prometheus, loki]);
  });

  it('does not look up the default data source when current is set', () => {
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(useDefaultMock).toHaveBeenLastCalledWith([]);
  });

  it('shows a "not found" value and marks the picker invalid when the current data source does not exist', () => {
    render(<DataSourcePicker current="missing-uid" onChange={jest.fn()} />);

    expect(screen.getByText('missing-uid - not found')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows "No datasources found" without looking up the default when noDefault is set and there is no current value', () => {
    render(<DataSourcePicker current={null} noDefault onChange={jest.fn()} />);

    expect(screen.getByText('No datasources found')).toBeInTheDocument();
    expect(useDefaultMock).toHaveBeenLastCalledWith([]);
  });

  it('calls onChange with the selected list item', async () => {
    const onChange = jest.fn();
    render(<DataSourcePicker current="prom-uid" onChange={onChange} />);

    await select(screen.getByRole('combobox'), 'Loki', { container: document.body });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(loki);
  });

  it('shows the new value as soon as the current prop changes', () => {
    const { rerender } = render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    rerender(<DataSourcePicker current="loki-uid" onChange={jest.fn()} />);

    expect(screen.getByText('Loki')).toBeInTheDocument();
    expect(screen.queryByText('Prometheus')).not.toBeInTheDocument();
  });

  it('lists the data sources in the order the list API returns them', () => {
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    openMenu(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Prometheus', 'Loki']);
  });

  it('shows a loading state, not "not found", while the list is loading', () => {
    useListMock.mockReturnValue({ isLoading: true, items: [] });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(screen.queryByText('prom-uid - not found')).not.toBeInTheDocument();
    openMenu(screen.getByRole('combobox'));
    expect(screen.getByText('Loading options...')).toBeInTheDocument();
  });

  it('shows the placeholder, not "not found", while the default data source is loading', () => {
    useDefaultMock.mockReturnValue({ isLoading: true, item: undefined });
    render(<DataSourcePicker onChange={jest.fn()} />);

    expect(screen.getByText('Select datasource')).toBeInTheDocument();
    expect(screen.queryByText(/not found/)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an error message instead of "not found" and marks the picker invalid when the list fails to load', () => {
    useListMock.mockReturnValue({ isLoading: false, items: [], error: new Error('nope') });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(screen.queryByText('prom-uid - not found')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    openMenu(screen.getByRole('combobox'));
    expect(screen.getByText('Could not load data sources')).toBeInTheDocument();
  });
});
