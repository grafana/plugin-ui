import React from 'react';
import { render, screen } from '@testing-library/react';
import { Chance } from 'chance';
import { QueryEditorRow } from './QueryEditorRow';

describe('QueryEditorRow', () => {
  it('renders children', () => {
    const id = Chance().word();
    render(<QueryEditorRow>{id}</QueryEditorRow>);

    expect(screen.getByText(id)).toBeInTheDocument();
  });
});
