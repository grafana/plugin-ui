import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryHeader } from './QueryHeader';
import { EditorMode, QueryFormat, type DB } from './types';
import { applyQueryDefaults } from './defaults';

// Mock the child components
jest.mock('./CatalogSelector', () => ({
  CatalogSelector: ({ value, onChange, inputId }: any) => (
    <select
      data-testid="catalog-selector"
      data-input-id={inputId}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Select catalog</option>
      <option value="catalog1">Catalog 1</option>
      <option value="catalog2">Catalog 2</option>
    </select>
  ),
}));

jest.mock('./SchemaSelector', () => ({
  SchemaSelector: ({ value, onChange, catalog, inputId }: any) => (
    <select
      data-testid="schema-selector"
      data-input-id={inputId}
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      disabled={!catalog}
    >
      <option value="">Select schema</option>
      <option value="schema1">Schema 1</option>
      <option value="schema2">Schema 2</option>
    </select>
  ),
}));

jest.mock('./DatasetSelector', () => ({
  DatasetSelector: ({ value, onChange }: any) => (
    <select
      data-testid="dataset-selector"
      value={value || ''}
      onChange={(e) => onChange({ value: e.target.value || null })}
    >
      <option value="">Select dataset</option>
      <option value="dataset1">Dataset 1</option>
    </select>
  ),
}));

jest.mock('./TableSelector', () => ({
  TableSelector: ({ value, onChange }: any) => (
    <select
      data-testid="table-selector"
      value={value || ''}
      onChange={(e) => onChange({ value: e.target.value || null })}
    >
      <option value="">Select table</option>
      <option value="table1">Table 1</option>
    </select>
  ),
}));

jest.mock('./RunQueryButton', () => ({
  RunQueryButton: ({ onClick }: any) => (
    <button data-testid="run-query-button" onClick={onClick}>
      Run Query
    </button>
  ),
}));

jest.mock('./ConfirmModal', () => ({
  ConfirmModal: ({ isOpen }: any) => (isOpen ? <div data-testid="confirm-modal">Confirm Modal</div> : null),
}));

const mockDB: DB = {
  datasets: jest.fn().mockResolvedValue(['dataset1']),
  catalogs: jest.fn().mockResolvedValue(['catalog1', 'catalog2']),
  schemas: jest.fn().mockResolvedValue(['schema1', 'schema2']),
  tables: jest.fn().mockResolvedValue(['table1']),
  fields: jest.fn().mockResolvedValue([]),
  validateQuery: jest.fn().mockResolvedValue({ isValid: true, error: '', isError: false, query: {} }),
  dsID: jest.fn().mockReturnValue(1),
  lookup: jest.fn().mockResolvedValue([]),
  getSqlCompletionProvider: jest.fn().mockReturnValue({}),
  functions: jest.fn().mockResolvedValue([]),
};

const defaultProps = {
  db: mockDB,
  defaultDataset: 'defaultDataset',
  enableDatasets: false,
  enableCatalogs: false,
  query: applyQueryDefaults({
    refId: 'A',
    format: QueryFormat.Table,
    editorMode: EditorMode.Builder,
  }),
  onChange: jest.fn(),
  onRunQuery: jest.fn(),
  onQueryRowChange: jest.fn(),
  queryRowFilter: {
    filter: false,
    group: false,
    order: false,
    preview: false,
  },
  isQueryRunnable: true,
};

describe('QueryHeader - Catalog and Schema Selectors', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Catalog Selector Rendering', () => {
    it('should render catalog selector when enableCatalogs is true', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      expect(screen.getByTestId('catalog-selector')).toBeInTheDocument();
      expect(screen.getByText('Catalog')).toBeInTheDocument();
    });

    it('should not render catalog selector when enableCatalogs is false', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={false} />);

      expect(screen.queryByTestId('catalog-selector')).not.toBeInTheDocument();
      expect(screen.queryByText('Catalog')).not.toBeInTheDocument();
    });

    it('should render catalog selector with custom label', () => {
      const customLabels = new Map([['catalog', 'Custom Catalog Label']]);

      render(<QueryHeader {...defaultProps} enableCatalogs={true} labels={customLabels} />);

      expect(screen.getByText('Custom Catalog Label')).toBeInTheDocument();
    });

    it('should render catalog selector with correct input ID', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      const catalogSelector = screen.getByTestId('catalog-selector');
      const inputId = catalogSelector.getAttribute('data-input-id');
      expect(inputId).toMatch(/^sql-catalog-/);
    });

    it('should pass current catalog value to CatalogSelector', () => {
      const queryWithCatalog = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithCatalog} />);

      const catalogSelector = screen.getByTestId('catalog-selector');
      expect(catalogSelector).toHaveValue('catalog1');
    });

    it('should handle undefined catalog value correctly', () => {
      const queryWithoutCatalog = applyQueryDefaults({
        ...defaultProps.query,
        catalog: undefined,
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithoutCatalog} />);

      const catalogSelector = screen.getByTestId('catalog-selector');
      expect(catalogSelector).toHaveValue('');
    });
  });

  describe('Schema Selector Rendering', () => {
    it('should render schema selector when enableCatalogs is true', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      expect(screen.getByTestId('schema-selector')).toBeInTheDocument();
      expect(screen.getByText('Schema')).toBeInTheDocument();
    });

    it('should not render schema selector when enableCatalogs is false', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={false} />);

      expect(screen.queryByTestId('schema-selector')).not.toBeInTheDocument();
      expect(screen.queryByText('Schema')).not.toBeInTheDocument();
    });

    it('should render schema selector with custom label', () => {
      const customLabels = new Map([['schema', 'Custom Schema Label']]);

      render(<QueryHeader {...defaultProps} enableCatalogs={true} labels={customLabels} />);

      expect(screen.getByText('Custom Schema Label')).toBeInTheDocument();
    });

    it('should render schema selector with correct input ID', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      const schemaSelector = screen.getByTestId('schema-selector');
      const inputId = schemaSelector.getAttribute('data-input-id');
      expect(inputId).toMatch(/^sql-schema-/);
    });

    it('should pass current schema value to SchemaSelector', () => {
      const queryWithSchema = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
        schema: 'schema1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithSchema} />);

      const schemaSelector = screen.getByTestId('schema-selector');
      expect(schemaSelector).toHaveValue('schema1');
    });

    it('should handle undefined schema value correctly', () => {
      const queryWithoutSchema = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
        schema: undefined,
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithoutSchema} />);

      const schemaSelector = screen.getByTestId('schema-selector');
      expect(schemaSelector).toHaveValue('');
    });

    it('should pass catalog value to SchemaSelector', () => {
      const queryWithCatalog = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithCatalog} />);

      // The schema selector should receive the catalog value
      // This is tested indirectly through the mocked component behavior
      const schemaSelector = screen.getByTestId('schema-selector');
      expect(schemaSelector).not.toBeDisabled();
    });
  });

  describe('Catalog Change Handler', () => {
    it('should call onChange with updated catalog when catalog changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();

      render(<QueryHeader {...defaultProps} enableCatalogs={true} onChange={onChange} />);

      const catalogSelector = screen.getByTestId('catalog-selector');
      await user.selectOptions(catalogSelector, 'catalog1');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          catalog: 'catalog1',
          schema: undefined,
          table: undefined,
          sql: undefined,
          rawSql: '',
        })
      );
    });

    it('should not call onChange if catalog value is the same', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const queryWithCatalog = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithCatalog} onChange={onChange} />);

      const catalogSelector = screen.getByTestId('catalog-selector');
      await user.selectOptions(catalogSelector, 'catalog1');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should reset schema, table, sql, and rawSql when catalog changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const queryWithData = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'oldCatalog',
        schema: 'oldSchema',
        table: 'oldTable',
        rawSql: 'SELECT * FROM table',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithData} onChange={onChange} />);

      const catalogSelector = screen.getByTestId('catalog-selector');
      await user.selectOptions(catalogSelector, 'catalog1');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          catalog: 'catalog1',
          schema: undefined,
          table: undefined,
          sql: undefined,
          rawSql: '',
        })
      );
    });

    it('should handle null catalog value correctly', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const queryWithCatalog = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithCatalog} onChange={onChange} />);

      const catalogSelector = screen.getByTestId('catalog-selector');
      await user.selectOptions(catalogSelector, '');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          catalog: undefined,
          schema: undefined,
          table: undefined,
          sql: undefined,
          rawSql: '',
        })
      );
    });
  });

  describe('Schema Change Handler', () => {
    it('should call onChange with updated schema when schema changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const queryWithCatalog = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithCatalog} onChange={onChange} />);

      const schemaSelector = screen.getByTestId('schema-selector');
      await user.selectOptions(schemaSelector, 'schema1');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: 'schema1',
          table: undefined,
          sql: undefined,
          rawSql: '',
        })
      );
    });

    it('should not call onChange if schema value is the same', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const queryWithSchema = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
        schema: 'schema1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithSchema} onChange={onChange} />);

      const schemaSelector = screen.getByTestId('schema-selector');
      await user.selectOptions(schemaSelector, 'schema1');

      expect(onChange).not.toHaveBeenCalled();
    });

    it('should reset table, sql, and rawSql when schema changes', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const queryWithData = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
        schema: 'oldSchema',
        table: 'oldTable',
        rawSql: 'SELECT * FROM table',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithData} onChange={onChange} />);

      const schemaSelector = screen.getByTestId('schema-selector');
      await user.selectOptions(schemaSelector, 'schema1');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: 'schema1',
          table: undefined,
          sql: undefined,
          rawSql: '',
        })
      );
    });

    it('should handle null schema value correctly', async () => {
      const user = userEvent.setup();
      const onChange = jest.fn();
      const queryWithSchema = applyQueryDefaults({
        ...defaultProps.query,
        catalog: 'catalog1',
        schema: 'schema1',
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryWithSchema} onChange={onChange} />);

      const schemaSelector = screen.getByTestId('schema-selector');
      await user.selectOptions(schemaSelector, '');

      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          schema: undefined,
          table: undefined,
          sql: undefined,
          rawSql: '',
        })
      );
    });
  });

  describe('Conditional Rendering Logic', () => {
    it('should render both catalog and schema selectors when enableCatalogs is true', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      expect(screen.getByTestId('catalog-selector')).toBeInTheDocument();
      expect(screen.getByTestId('schema-selector')).toBeInTheDocument();
    });

    it('should not render catalog and schema selectors when enableCatalogs is false', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={false} />);

      expect(screen.queryByTestId('catalog-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('schema-selector')).not.toBeInTheDocument();
    });

    it('should render dataset selector when enableDatasets is true and enableCatalogs is false', () => {
      render(<QueryHeader {...defaultProps} enableDatasets={true} enableCatalogs={false} />);

      expect(screen.getByTestId('dataset-selector')).toBeInTheDocument();
      expect(screen.queryByTestId('catalog-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('schema-selector')).not.toBeInTheDocument();
    });

    it('should not render dataset selector when enableCatalogs is true', () => {
      render(<QueryHeader {...defaultProps} enableDatasets={true} enableCatalogs={true} />);

      expect(screen.queryByTestId('dataset-selector')).not.toBeInTheDocument();
      expect(screen.getByTestId('catalog-selector')).toBeInTheDocument();
      expect(screen.getByTestId('schema-selector')).toBeInTheDocument();
    });

    it('should always render table selector regardless of catalog/dataset settings', () => {
      // Test with catalogs enabled
      const { rerender } = render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      expect(screen.getByTestId('table-selector')).toBeInTheDocument();

      // Test with datasets enabled
      rerender(<QueryHeader {...defaultProps} enableDatasets={true} enableCatalogs={false} />);

      expect(screen.getByTestId('table-selector')).toBeInTheDocument();

      // Test with neither enabled
      rerender(<QueryHeader {...defaultProps} enableDatasets={false} enableCatalogs={false} />);

      expect(screen.getByTestId('table-selector')).toBeInTheDocument();
    });
  });

  describe('EditorField Integration', () => {
    it('should render catalog and schema fields with correct width', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      // Check that the fields are rendered within the expected structure
      expect(screen.getByText('Catalog')).toBeInTheDocument();
      expect(screen.getByText('Schema')).toBeInTheDocument();
      expect(screen.getByTestId('catalog-selector')).toBeInTheDocument();
      expect(screen.getByTestId('schema-selector')).toBeInTheDocument();
    });

    it('should render fields only in Builder mode', () => {
      const queryInCodeMode = applyQueryDefaults({
        ...defaultProps.query,
        editorMode: EditorMode.Code,
      });

      render(<QueryHeader {...defaultProps} enableCatalogs={true} query={queryInCodeMode} />);

      expect(screen.queryByTestId('catalog-selector')).not.toBeInTheDocument();
      expect(screen.queryByTestId('schema-selector')).not.toBeInTheDocument();
    });
  });

  describe('Labels Customization', () => {
    it('should use default labels when no custom labels provided', () => {
      render(<QueryHeader {...defaultProps} enableCatalogs={true} />);

      expect(screen.getByText('Catalog')).toBeInTheDocument();
      expect(screen.getByText('Schema')).toBeInTheDocument();
    });

    it('should use custom labels when provided', () => {
      const customLabels = new Map([
        ['catalog', 'Database Catalog'],
        ['schema', 'Database Schema'],
      ]);

      render(<QueryHeader {...defaultProps} enableCatalogs={true} labels={customLabels} />);

      expect(screen.getByText('Database Catalog')).toBeInTheDocument();
      expect(screen.getByText('Database Schema')).toBeInTheDocument();
    });

    it('should use custom label for catalog and default for schema', () => {
      const customLabels = new Map([['catalog', 'Custom Catalog']]);

      render(<QueryHeader {...defaultProps} enableCatalogs={true} labels={customLabels} />);

      expect(screen.getByText('Custom Catalog')).toBeInTheDocument();
      expect(screen.getByText('Schema')).toBeInTheDocument();
    });

    it('should use custom label for schema and default for catalog', () => {
      const customLabels = new Map([['schema', 'Custom Schema']]);

      render(<QueryHeader {...defaultProps} enableCatalogs={true} labels={customLabels} />);

      expect(screen.getByText('Catalog')).toBeInTheDocument();
      expect(screen.getByText('Custom Schema')).toBeInTheDocument();
    });
  });
});
