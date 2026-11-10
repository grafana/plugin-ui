import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { StringArrayInput } from './StringArrayInput';

function setup(initial: string[] = []) {
  const onChange = jest.fn();
  const { rerender } = render(
    <StringArrayInput value={initial} onChange={onChange} placeholder="New cookie (hit enter to add)" />
  );
  const update = (next: string[]) => {
    rerender(<StringArrayInput value={next} onChange={onChange} placeholder="New cookie (hit enter to add)" />);
  };
  return { onChange, update };
}

describe('StringArrayInput', () => {
  it('renders existing items', () => {
    setup(['cookieA', 'cookieB']);
    expect(screen.getByDisplayValue('cookieA')).toBeInTheDocument();
    expect(screen.getByDisplayValue('cookieB')).toBeInTheDocument();
  });

  it('clicking Add appends an empty row', () => {
    const { onChange } = setup(['existing']);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(onChange).toHaveBeenCalledWith(['existing', '']);
  });

  describe('Enter key', () => {
    it('prevents form submission', () => {
      setup(['onrff']);
      const input = screen.getByDisplayValue('onrff');
      const event = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true });
      const prevented = !input.dispatchEvent(event);
      expect(prevented).toBe(true);
    });

    it('appends an empty row when the last item is valid', () => {
      const { onChange } = setup(['onrff']);
      const input = screen.getByDisplayValue('onrff');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).toHaveBeenCalledWith(['onrff', '']);
    });

    it('does not append when the item is empty', () => {
      const { onChange } = setup(['']);
      const inputs = screen.getAllByPlaceholderText('New cookie (hit enter to add)');
      fireEvent.keyDown(inputs[0], { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not append when the item is whitespace only', () => {
      const { onChange } = setup(['   ']);
      const inputs = screen.getAllByPlaceholderText('New cookie (hit enter to add)');
      fireEvent.keyDown(inputs[0], { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not append when the item duplicates another row', () => {
      const { onChange } = setup(['session', 'session']);
      const inputs = screen.getAllByDisplayValue('session');
      // Press Enter on the second row which duplicates the first.
      fireEvent.keyDown(inputs[1], { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('treats trimmed equality as duplicate', () => {
      const { onChange } = setup(['session', ' session ']);
      const inputs = screen.getAllByPlaceholderText('New cookie (hit enter to add)');
      // Second row trims to match the first → should not be committed.
      fireEvent.keyDown(inputs[1], { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    });

    it('does not append when Enter is pressed on a non-last valid row', () => {
      // Enter only commits the last (in-progress) row. Editing an existing
      // middle row should not duplicate it.
      const { onChange } = setup(['first', 'second']);
      const input = screen.getByDisplayValue('first');
      fireEvent.keyDown(input, { key: 'Enter' });
      expect(onChange).not.toHaveBeenCalled();
    });
  });
});
