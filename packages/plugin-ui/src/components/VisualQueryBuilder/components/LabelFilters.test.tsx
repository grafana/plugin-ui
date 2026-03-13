import { getAllByRole, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { type ComponentProps } from 'react';
import { select } from 'react-select-event';
import { LabelFilters, MISSING_LABEL_FILTER_ERROR_MESSAGE } from './LabelFilters';

describe('LabelFilters', () => {
  it('renders empty input without labels', async () => {
    setup();
    expect(screen.getAllByText('Select label')).toHaveLength(1);
    expect(screen.getAllByText('Select value')).toHaveLength(1);
    expect(screen.getByText(/=/)).toBeInTheDocument();
    expect(getAddButton()).toBeInTheDocument();
  });

  it('renders multiple labels', async () => {
    setup({
      labelsFilters: [
        { label: 'foo', op: '=', value: 'bar' },
        { label: 'baz', op: '!=', value: 'qux' },
        { label: 'quux', op: '=~', value: 'quuz' },
      ],
    });
    expect(screen.getByText(/foo/)).toBeInTheDocument();
    expect(screen.getByText(/bar/)).toBeInTheDocument();
    expect(screen.getByText(/baz/)).toBeInTheDocument();
    expect(screen.getByText(/qux/)).toBeInTheDocument();
    expect(screen.getByText(/quux/)).toBeInTheDocument();
    expect(screen.getByText(/quuz/)).toBeInTheDocument();
    expect(getAddButton()).toBeInTheDocument();
  });

  it('renders multiple values for regex selectors', async () => {
    setup({
      labelsFilters: [
        { label: 'bar', op: '!~', value: 'baz|bat|bau' },
        { label: 'foo', op: '!~', value: 'fop|for|fos' },
      ],
    });
    expect(screen.getByText(/bar/)).toBeInTheDocument();
    expect(screen.getByText(/baz/)).toBeInTheDocument();
    expect(screen.getByText(/bat/)).toBeInTheDocument();
    expect(screen.getByText(/bau/)).toBeInTheDocument();
    expect(screen.getByText(/foo/)).toBeInTheDocument();
    expect(screen.getByText(/for/)).toBeInTheDocument();
    expect(screen.getByText(/fos/)).toBeInTheDocument();
    expect(getAddButton()).toBeInTheDocument();
  });

  it('adds new label', async () => {
    const { onChange } = setup({ labelsFilters: [{ label: 'foo', op: '=', value: 'bar' }] });
    await userEvent.click(getAddButton());
    expect(screen.getAllByText('Select label')).toHaveLength(1);
    expect(screen.getAllByText('Select value')).toHaveLength(1);
    const { name, value } = getLabelSelects(1);
    await selectOptionInTest(name, 'baz');
    await selectOptionInTest(value, 'qux');
    expect(onChange).toBeCalledWith([
      { label: 'foo', op: '=', value: 'bar' },
      { label: 'baz', op: '=', value: 'qux' },
    ]);
  });

  it('removes label', async () => {
    const { onChange } = setup({ labelsFilters: [{ label: 'foo', op: '=', value: 'bar' }] });
    await userEvent.click(screen.getByLabelText(/remove/));
    expect(onChange).toBeCalledWith([]);
  });

  it('renders empty input when labels are deleted from outside ', async () => {
    const { rerender } = setup({ labelsFilters: [{ label: 'foo', op: '=', value: 'bar' }] });
    expect(screen.getByText(/foo/)).toBeInTheDocument();
    expect(screen.getByText(/bar/)).toBeInTheDocument();
    rerender(
      <LabelFilters onChange={jest.fn()} onGetLabelNames={jest.fn()} onGetLabelValues={jest.fn()} labelsFilters={[]} />
    );
    expect(screen.getAllByText('Select label')).toHaveLength(1);
    expect(screen.getAllByText('Select value')).toHaveLength(1);
    expect(screen.getByText(/=/)).toBeInTheDocument();
    expect(getAddButton()).toBeInTheDocument();
  });

  it('shows error when filter with empty strings  and label filter is required', async () => {
    setup({ labelsFilters: [{ label: '', op: '=', value: '' }], labelFilterRequired: true });
    expect(screen.getByText(MISSING_LABEL_FILTER_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('shows error when no filter and label filter is required', async () => {
    setup({ labelsFilters: [], labelFilterRequired: true });
    expect(screen.getByText(MISSING_LABEL_FILTER_ERROR_MESSAGE)).toBeInTheDocument();
  });

  it('runs onChange after all selects are changed', async () => {
    const { onChange } = setup({ labelsFilters: [{ label: 'foo', op: '=', value: 'bar' }] });
    await userEvent.click(getAddButton());
    expect(screen.getAllByText('Select label')).toHaveLength(1);
    expect(screen.getAllByText('Select value')).toHaveLength(1);
    const { name, value, op } = getLabelSelects(1);
    await selectOptionInTest(name, 'baz');
    expect(onChange).not.toBeCalled();
    await selectOptionInTest(op, '!=');
    expect(onChange).not.toBeCalled();
    await selectOptionInTest(value, 'qux');
    expect(onChange).toBeCalledWith([
      { label: 'foo', op: '=', value: 'bar' },
      { label: 'baz', op: '!=', value: 'qux' },
    ]);
  });
});

function setup(propOverrides?: Partial<ComponentProps<typeof LabelFilters>>) {
  const defaultProps = {
    onChange: jest.fn(),
    onGetLabelNames: async () => [
      { label: 'foo', value: 'foo' },
      { label: 'bar', value: 'bar' },
      { label: 'baz', value: 'baz' },
    ],
    onGetLabelValues: async () => [
      { label: 'bar', value: 'bar' },
      { label: 'qux', value: 'qux' },
      { label: 'quux', value: 'quux' },
    ],
    labelsFilters: [],
  };

  const props = { ...defaultProps, ...propOverrides };

  const { rerender } = render(<LabelFilters {...props} />);
  return { ...props, rerender };
}

function getAddButton() {
  return screen.getByLabelText(/Add/);
}

function getLabelSelects(index = 0) {
  const labels = screen.getByText(/Label filters/);
  const selects = getAllByRole(labels.parentElement!.parentElement!.parentElement!, 'combobox');
  return {
    name: selects[3 * index],
    op: selects[3 * index + 1],
    value: selects[3 * index + 2],
  };
}

export const selectOptionInTest = async (
  input: HTMLElement,
  optionOrOptions: string | RegExp | Array<string | RegExp>
) => await waitFor(() => select(input, optionOrOptions, { container: document.body }));
