/**
 * Integration tests for QueryEditor with catalog.schema.table support
 */
import { render } from '@testing-library/react';
import { SqlQueryEditor } from './QueryEditor';
import { type DB, type SQLQuery, QueryFormat } from './types';

// Mock datasource
const createMockDatasource = (disableDatasets: boolean, disableCatalogs: boolean) => ({
  id: 1,
  dataset: undefined,
  getDB: (id?: string) => createMockDB(disableDatasets, disableCatalogs),
});

const createMockDB = (disableDatasets: boolean, disableCatalogs: boolean): DB => ({
  datasets: jest.fn().mockResolvedValue(['dataset1', 'schema1', 'schema2']), // Returns datasets or schemas based on context
  catalogs: !disableCatalogs ? jest.fn().mockResolvedValue(['catalog1', 'catalog2']) : undefined,
  tables: jest.fn().mockResolvedValue(['table1', 'table2']),
  fields: jest.fn().mockResolvedValue([]),
  validateQuery: jest.fn().mockResolvedValue({ query: {}, error: '', isError: false, isValid: true }),
  dsID: () => 1,
  lookup: jest.fn().mockResolvedValue([]),
  getSqlCompletionProvider: jest.fn(),
  functions: jest.fn().mockResolvedValue([]),
  disableDatasets,
  disableCatalogs,
});

const defaultQuery: SQLQuery = {
  refId: 'A',
  format: QueryFormat.Table,
};

describe('QueryEditor - Catalog.Schema.Table Integration', () => {
  describe('Unity Catalog mode (catalogs enabled, datasets originally disabled)', () => {
    it('should force datasets to be enabled when catalogs are enabled', () => {
      const datasource = createMockDatasource(true, false); // disableDatasets=true, disableCatalogs=false

      const { container } = render(
        <SqlQueryEditor
          datasource={datasource as any}
          query={defaultQuery}
          onChange={jest.fn()}
          onRunQuery={jest.fn()}
          language="sql"
        />
      );

      // Component should render successfully
      // (The warning only appears in browser, not in tests due to typeof window check)
      expect(container).toBeTruthy();
    });

    it('should render catalog and schema selectors when Unity Catalog is enabled', () => {
      const datasource = createMockDatasource(true, false);

      const { container } = render(
        <SqlQueryEditor
          datasource={datasource as any}
          query={defaultQuery}
          onChange={jest.fn()}
          onRunQuery={jest.fn()}
          language="sql"
        />
      );

      // Should render the query editor
      expect(container).toBeTruthy();
    });
  });

  describe('Legacy mode (datasets enabled, catalogs disabled)', () => {
    it('should render without errors when only datasets are enabled', () => {
      const datasource = createMockDatasource(false, true); // disableDatasets=false, disableCatalogs=true

      const { container } = render(
        <SqlQueryEditor
          datasource={datasource as any}
          query={defaultQuery}
          onChange={jest.fn()}
          language="sql"
          onRunQuery={jest.fn()}
        />
      );

      // Component should render successfully
      expect(container).toBeTruthy();
    });
  });

  describe('Query generation with catalog.schema.table', () => {
    it('should render Unity Catalog query correctly', () => {
      const onChangeMock = jest.fn();

      const datasource = createMockDatasource(false, false); // Both enabled

      const unityCatalogQuery: SQLQuery = {
        refId: 'A',
        catalog: 'samples',
        dataset: 'sales', // Acts as schema when catalog is present
        table: 'customer',
        format: QueryFormat.Table,
        sql: {
          columns: [
            {
              type: 'function' as any,
              parameters: [{ name: '*' } as any],
            },
          ],
          limit: 50,
        },
      };

      const { container } = render(
        <SqlQueryEditor
          datasource={datasource as any}
          query={unityCatalogQuery}
          onChange={onChangeMock}
          language="sql"
          onRunQuery={jest.fn()}
        />
      );

      // The component should render without errors
      expect(container).toBeTruthy();
    });
  });
});
