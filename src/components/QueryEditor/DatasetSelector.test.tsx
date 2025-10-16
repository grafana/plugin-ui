/**
 * Tests for DatasetSelector component (dual-mode: dataset or schema)
 */
import { render, waitFor } from '@testing-library/react';
import { DatasetSelector } from './DatasetSelector';
import { type DB } from './types';

const createMockDB = (datasets: string[], schemas?: string[]): DB => ({
  datasets: jest.fn().mockResolvedValue(datasets),
  schemas: schemas !== undefined ? jest.fn().mockResolvedValue(schemas) : jest.fn().mockResolvedValue([]),
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

      expect(mockDB.schemas).not.toHaveBeenCalled();
    });
  });

  describe('Unity Catalog mode (with catalog)', () => {
    it('should fetch schemas when catalog is provided', async () => {
      const mockDB = createMockDB(['dataset1'], ['schema1', 'schema2']);
      const onChangeMock = jest.fn();

      render(<DatasetSelector db={mockDB} dataset="" catalog="samples" value={null} onChange={onChangeMock} />);

      await waitFor(() => {
        expect(mockDB.schemas).toHaveBeenCalledWith('samples');
      });

      // Should NOT fetch datasets when catalog is provided
      expect(mockDB.datasets).not.toHaveBeenCalled();
    });

    it('should refetch schemas when catalog changes', async () => {
      const mockDB = createMockDB(['dataset1'], ['schema1', 'schema2']);
      const onChangeMock = jest.fn();

      const { rerender } = render(
        <DatasetSelector db={mockDB} dataset="" catalog="catalog1" value={null} onChange={onChangeMock} />
      );

      await waitFor(() => {
        expect(mockDB.schemas).toHaveBeenCalledWith('catalog1');
      });

      // Change catalog
      rerender(<DatasetSelector db={mockDB} dataset="" catalog="catalog2" value={null} onChange={onChangeMock} />);

      await waitFor(() => {
        expect(mockDB.schemas).toHaveBeenCalledWith('catalog2');
      });

      // Should have been called twice (once for each catalog)
      expect(mockDB.schemas).toHaveBeenCalledTimes(2);
    });

    it('should fallback to datasets when db.schemas is not defined', async () => {
      const mockDB = createMockDB(['dataset1', 'dataset2']);
      mockDB.schemas = undefined; // No schemas function

      const onChangeMock = jest.fn();

      render(<DatasetSelector db={mockDB} dataset="" catalog="samples" value={null} onChange={onChangeMock} />);

      await waitFor(() => {
        expect(mockDB.datasets).toHaveBeenCalled();
      });
    });
  });
});
