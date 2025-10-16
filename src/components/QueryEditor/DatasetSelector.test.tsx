/**
 * Tests for DatasetSelector component (dual-mode: dataset or schema)
 * Note: The dataset field has dual meaning - it represents schema when catalog is present, dataset otherwise.
 */
import { render, waitFor } from '@testing-library/react';
import { DatasetSelector } from './DatasetSelector';
import { type DB } from './types';

const createMockDB = (datasets: string[]): DB => ({
  datasets: jest.fn().mockResolvedValue(datasets),
  tables: jest.fn().mockResolvedValue([]),
  fields: jest.fn().mockResolvedValue([]),
  validateQuery: jest.fn().mockResolvedValue({ query: {}, error: '', isError: false, isValid: true }),
  dsID: () => 1,
  lookup: jest.fn().mockResolvedValue([]),
  getSqlCompletionProvider: jest.fn(),
  functions: jest.fn().mockResolvedValue([]),
  disableDatasets: false,
  disableCatalogs: true,
});

describe('DatasetSelector', () => {
  describe('Legacy mode (no catalog)', () => {
    it('should fetch and display datasets when no catalog is provided', async () => {
      const mockDB = createMockDB(['dataset1', 'dataset2']);
      const onChangeMock = jest.fn();

      render(<DatasetSelector db={mockDB} dataset="" value={null} onChange={onChangeMock} />);

      await waitFor(() => {
        expect(mockDB.datasets).toHaveBeenCalled();
      });
    });
  });

  describe('Unity Catalog mode (with catalog)', () => {
    it('should fetch schemas (via datasets) when catalog is provided', async () => {
      const mockDB = createMockDB(['schema1', 'schema2']);
      const onChangeMock = jest.fn();

      render(<DatasetSelector db={mockDB} dataset="" catalog="samples" value={null} onChange={onChangeMock} />);

      await waitFor(() => {
        expect(mockDB.datasets).toHaveBeenCalled();
      });
    });

    it('should refetch schemas when catalog changes', async () => {
      const mockDB = createMockDB(['schema1', 'schema2']);
      const onChangeMock = jest.fn();

      const { rerender } = render(
        <DatasetSelector db={mockDB} dataset="" catalog="catalog1" value={null} onChange={onChangeMock} />
      );

      await waitFor(() => {
        expect(mockDB.datasets).toHaveBeenCalled();
      });

      // Change catalog - should trigger new fetch
      rerender(<DatasetSelector db={mockDB} dataset="" catalog="catalog2" value={null} onChange={onChangeMock} />);

      await waitFor(() => {
        expect(mockDB.datasets).toHaveBeenCalledTimes(2);
      });
    });
  });
});
