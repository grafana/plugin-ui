import React from 'react';
import { render, screen } from '@testing-library/react';
import { openMenu, select } from 'react-select-event';
import { useDataSourceInstanceList, useDataSourceInstanceListItem } from '@grafana/plugin-compat/datasources';
import { DataSourcePicker, type Props } from './DataSourcePicker';

jest.mock('@grafana/plugin-compat/datasources', () => ({
  useDataSourceInstanceList: jest.fn(),
  useDataSourceInstanceListItem: jest.fn(),
}));

type DataSourceListItem = Parameters<Props['onChange']>[0];

const useListMock = jest.mocked(useDataSourceInstanceList);
const useItemMock = jest.mocked(useDataSourceInstanceListItem);

const listItem = (uid: string, name: string): DataSourceListItem => ({
  uid,
  name,
  type: name.toLowerCase(),
  meta: {
    id: name.toLowerCase(),
    name,
    signature: 'internal',
    info: { logos: { small: `${name}.svg`, large: `${name}-large.svg` } },
  } as unknown as DataSourceListItem['meta'],
});

const prometheus = listItem('prom-uid', 'Prometheus');
const loki = listItem('loki-uid', 'Loki');
const mixed = listItem('-- Mixed --', '-- Mixed --');

// Stands in for the host's resolution, which also handles names, template variables and built-ins.
const resolvesTo = (refs: Record<string, DataSourceListItem>, defaultItem?: DataSourceListItem) => {
  useItemMock.mockImplementation((ref) => ({
    isLoading: false,
    item: typeof ref === 'string' ? refs[ref] : defaultItem,
  }));
};

describe('DataSourcePicker', () => {
  beforeEach(() => {
    useListMock.mockReset();
    useItemMock.mockReset();
    useListMock.mockReturnValue({ isLoading: false, items: [prometheus, loki] });
    resolvesTo({ 'prom-uid': prometheus, 'loki-uid': loki });
  });

  it('shows the name of the data source that current resolves to', () => {
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(screen.getByText('Prometheus')).toBeInTheDocument();
    expect(useItemMock).toHaveBeenLastCalledWith('prom-uid');
  });

  it('shows data sources that resolve but are not in the list, such as template variables or Mixed', () => {
    resolvesTo({ $ds: loki, '-- Mixed --': mixed });
    const { rerender } = render(<DataSourcePicker current="$ds" onChange={jest.fn()} />);

    expect(screen.getByText('Loki')).toBeInTheDocument();

    rerender(<DataSourcePicker current="-- Mixed --" onChange={jest.fn()} />);

    expect(screen.getByText('-- Mixed --')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('resolves the default data source when current is not set', () => {
    resolvesTo({}, loki);
    render(<DataSourcePicker onChange={jest.fn()} />);

    expect(screen.getByText('Loki')).toBeInTheDocument();
    expect(useItemMock).toHaveBeenLastCalledWith(null);
  });

  it('shows a "not found" value and marks the picker invalid when current does not resolve', () => {
    render(<DataSourcePicker current="missing-uid" onChange={jest.fn()} />);

    expect(screen.getByText('missing-uid - not found')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows "No datasources found" instead of the default when noDefault is set and there is no current value', () => {
    resolvesTo({}, loki);
    render(<DataSourcePicker current={null} noDefault onChange={jest.fn()} />);

    expect(screen.getByText('No datasources found')).toBeInTheDocument();
    expect(screen.queryByText('Loki')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid', 'true');
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

  it('shows a loading state while the list is loading', () => {
    useListMock.mockReturnValue({ isLoading: true, items: [] });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    openMenu(screen.getByRole('combobox'));
    expect(screen.getByText('Loading options...')).toBeInTheDocument();
  });

  it('shows the placeholder, not "not found", while current is resolving', () => {
    useItemMock.mockReturnValue({ isLoading: true, item: undefined });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(screen.getByText('Select datasource')).toBeInTheDocument();
    expect(screen.queryByText(/not found/)).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('shows an error message and marks the picker invalid when the list fails to load', () => {
    useListMock.mockReturnValue({ isLoading: false, items: [], error: new Error('nope') });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(screen.getByText('Prometheus')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    openMenu(screen.getByRole('combobox'));
    expect(screen.getByText('Could not load data sources')).toBeInTheDocument();
  });
});
