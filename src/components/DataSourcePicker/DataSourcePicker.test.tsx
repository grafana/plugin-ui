import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { openMenu, select } from 'react-select-event';
import { type DataSourceInstanceSettings } from '@grafana/data';
import { getDataSourceInstanceSettings, useDataSourceInstanceList } from '@grafana/plugin-compat/datasources';
import { DataSourcePicker } from './DataSourcePicker';

jest.mock('@grafana/plugin-compat/datasources', () => ({
  getDataSourceInstanceSettings: jest.fn(),
  useDataSourceInstanceList: jest.fn(),
}));

type DataSourceInstanceListItem = ReturnType<typeof useDataSourceInstanceList>['items'][number];

const getSettingsMock = jest.mocked(getDataSourceInstanceSettings);
const useListMock = jest.mocked(useDataSourceInstanceList);

const meta = (name: string) =>
  ({
    id: name.toLowerCase(),
    name,
    signature: 'internal',
    info: { logos: { small: `${name}.svg`, large: `${name}-large.svg` } },
  }) as unknown as DataSourceInstanceListItem['meta'];

const listItem = (uid: string, name: string): DataSourceInstanceListItem => ({
  uid,
  name,
  type: name.toLowerCase(),
  meta: meta(name),
});

const settingsFor = (uid: string, name: string): DataSourceInstanceSettings =>
  ({
    uid,
    name,
    type: name.toLowerCase(),
    meta: meta(name),
    jsonData: { fullSettingsOnly: true },
  }) as unknown as DataSourceInstanceSettings;

const prometheus = settingsFor('prom-uid', 'Prometheus');
const loki = settingsFor('loki-uid', 'Loki');
const all = [prometheus, loki];

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

describe('DataSourcePicker', () => {
  beforeEach(() => {
    getSettingsMock.mockReset();
    useListMock.mockReset();
    useListMock.mockReturnValue({
      isLoading: false,
      items: [listItem('prom-uid', 'Prometheus'), listItem('loki-uid', 'Loki')],
    });
    getSettingsMock.mockImplementation(async (ref) => {
      const key = typeof ref === 'string' ? ref : ref?.uid;
      return all.find((ds) => ds.uid === key || ds.name === key);
    });
  });

  it('shows the name of the current data source, resolved from its uid', async () => {
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    expect(await screen.findByText('Prometheus')).toBeInTheDocument();
    expect(getSettingsMock).toHaveBeenCalledWith('prom-uid');
  });

  it('resolves the default data source when current is not set', async () => {
    getSettingsMock.mockResolvedValueOnce(loki);
    render(<DataSourcePicker onChange={jest.fn()} />);

    expect(await screen.findByText('Loki')).toBeInTheDocument();
    expect(getSettingsMock).toHaveBeenCalledWith(null);
  });

  it('shows a "not found" value and marks the picker invalid when the current data source does not exist', async () => {
    render(<DataSourcePicker current="missing-uid" onChange={jest.fn()} />);

    expect(await screen.findByText('missing-uid - not found')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows "No datasources found" without resolving anything when noDefault is set and there is no current value', () => {
    render(<DataSourcePicker current={null} noDefault onChange={jest.fn()} />);

    expect(screen.getByText('No datasources found')).toBeInTheDocument();
    expect(getSettingsMock).not.toHaveBeenCalled();
  });

  it('calls onChange with the full instance settings of the selected data source', async () => {
    const onChange = jest.fn();
    render(<DataSourcePicker current="prom-uid" onChange={onChange} />);
    await screen.findByText('Prometheus');

    await select(screen.getByRole('combobox'), 'Loki', { container: document.body });

    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
    expect(getSettingsMock).toHaveBeenCalledWith('loki-uid');
    // The list items are slim, so the settings (e.g. jsonData) must come from getDataSourceInstanceSettings.
    expect(onChange).toHaveBeenCalledWith(loki);
  });

  it('does not call onChange and marks the picker invalid when the selected data source cannot be resolved', async () => {
    const onChange = jest.fn();
    render(<DataSourcePicker current="prom-uid" onChange={onChange} />);
    await screen.findByText('Prometheus');
    const pending = deferred<DataSourceInstanceSettings>();
    getSettingsMock.mockReturnValueOnce(pending.promise);

    await select(screen.getByRole('combobox'), 'Loki', { container: document.body });
    await act(async () => pending.reject(new Error('boom')));

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('only reports the most recent selection when selections resolve out of order', async () => {
    const onChange = jest.fn();
    render(<DataSourcePicker current="prom-uid" onChange={onChange} />);
    await screen.findByText('Prometheus');
    const first = deferred<DataSourceInstanceSettings>();
    const second = deferred<DataSourceInstanceSettings>();
    getSettingsMock.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);

    await select(screen.getByRole('combobox'), 'Loki', { container: document.body });
    await select(screen.getByRole('combobox'), 'Prometheus', { container: document.body });
    await act(async () => {
      second.resolve(prometheus);
      first.resolve(loki);
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(prometheus);
  });

  it('does not call onChange when unmounted before the selection resolves', async () => {
    const onChange = jest.fn();
    const { unmount } = render(<DataSourcePicker current="prom-uid" onChange={onChange} />);
    await screen.findByText('Prometheus');
    const pending = deferred<DataSourceInstanceSettings>();
    getSettingsMock.mockReturnValueOnce(pending.promise);

    await select(screen.getByRole('combobox'), 'Loki', { container: document.body });
    unmount();
    await act(async () => pending.resolve(loki));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('ignores a stale resolution of the current value after the current prop changed', async () => {
    const stale = deferred<DataSourceInstanceSettings>();
    getSettingsMock.mockReturnValueOnce(stale.promise);
    const { rerender } = render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);

    rerender(<DataSourcePicker current="loki-uid" onChange={jest.fn()} />);
    expect(await screen.findByText('Loki')).toBeInTheDocument();
    await act(async () => stale.resolve(prometheus));

    expect(screen.getByText('Loki')).toBeInTheDocument();
    expect(screen.queryByText('Prometheus')).not.toBeInTheDocument();
  });

  it('keeps showing the previous value while a new current value resolves', async () => {
    const { rerender } = render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);
    await screen.findByText('Prometheus');
    const pending = deferred<DataSourceInstanceSettings>();
    getSettingsMock.mockReturnValueOnce(pending.promise);

    rerender(<DataSourcePicker current="loki-uid" onChange={jest.fn()} />);

    expect(screen.getByText('Prometheus')).toBeInTheDocument();
    expect(screen.queryByText('Select datasource')).not.toBeInTheDocument();
    await act(async () => pending.resolve(loki));
    expect(screen.getByText('Loki')).toBeInTheDocument();
  });

  it('lists the data sources in the order the list API returns them', async () => {
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);
    await screen.findByText('Prometheus');

    openMenu(screen.getByRole('combobox'));

    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(['Prometheus', 'Loki']);
  });

  it('shows a loading state while the list is loading', async () => {
    useListMock.mockReturnValue({ isLoading: true, items: [] });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);
    await screen.findByText('Prometheus');

    openMenu(screen.getByRole('combobox'));

    expect(screen.getByText('Loading options...')).toBeInTheDocument();
  });

  it('shows an error message in the menu when the list fails to load', async () => {
    useListMock.mockReturnValue({ isLoading: false, items: [], error: new Error('nope') });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);
    await screen.findByText('Prometheus');

    openMenu(screen.getByRole('combobox'));

    expect(screen.getByText('Could not load data sources')).toBeInTheDocument();
  });

  it('marks the picker invalid when the list fails to load', async () => {
    useListMock.mockReturnValue({ isLoading: false, items: [], error: new Error('nope') });
    render(<DataSourcePicker current="prom-uid" onChange={jest.fn()} />);
    await screen.findByText('Prometheus');

    expect(screen.getByRole('combobox')).toHaveAttribute('aria-invalid', 'true');
  });
});
