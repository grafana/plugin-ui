import { defaultTableNameParser } from './tokenUtils';
import { type LinkedToken } from './LinkedToken';

describe('tokenUtils', () => {
  describe('defaultTableNameParser', () => {
    it('should return null when token is null', () => {
      const result = defaultTableNameParser(null);
      expect(result).toBeNull();
    });

    it('should return null when token is undefined', () => {
      const result = defaultTableNameParser(undefined);
      expect(result).toBeNull();
    });

    it('should parse single-part table name (table only)', () => {
      const token = {
        value: 'trips',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        table: 'trips',
      });
    });

    it('should parse two-part table name (schema.table)', () => {
      const token = {
        value: 'taxi.trips',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        schema: 'taxi',
        table: 'trips',
      });
    });

    it('should parse three-part table name (catalog.schema.table)', () => {
      const token = {
        value: 'samples.taxi.trips',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        catalog: 'samples',
        schema: 'taxi',
        table: 'trips',
      });
    });

    it('should return null for more than three-part table names', () => {
      const token = {
        value: 'server.catalog.schema.table',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toBeNull();
    });

    it('should handle table names with special characters', () => {
      const token = {
        value: 'my_catalog.my_schema.my_table',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        catalog: 'my_catalog',
        schema: 'my_schema',
        table: 'my_table',
      });
    });

    it('should handle table names with numbers', () => {
      const token = {
        value: 'catalog123.schema456.table789',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        catalog: 'catalog123',
        schema: 'schema456',
        table: 'table789',
      });
    });

    it('should handle mixed case table names', () => {
      const token = {
        value: 'MyCatalog.MySchema.MyTable',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        catalog: 'MyCatalog',
        schema: 'MySchema',
        table: 'MyTable',
      });
    });

    it('should handle empty parts in table name', () => {
      const token = {
        value: '..table',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        catalog: '',
        schema: '',
        table: 'table',
      });
    });

    it('should handle trailing dot', () => {
      const token = {
        value: 'catalog.schema.',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      // This will create a 3-part name with empty last part
      expect(result).toEqual({
        catalog: 'catalog',
        schema: 'schema',
        table: '',
      });
    });

    it('should handle leading dot', () => {
      const token = {
        value: '.schema.table',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      expect(result).toEqual({
        catalog: '',
        schema: 'schema',
        table: 'table',
      });
    });

    it('should return null for empty string', () => {
      const token = {
        value: '',
      } as LinkedToken;

      const result = defaultTableNameParser(token);

      // Empty string splits into [''] which has length 1
      expect(result).toEqual({
        table: '',
      });
    });

    it('should handle complex database names from real-world examples', () => {
      // Databricks example
      const databricksToken = {
        value: 'hive.default.customer_data',
      } as LinkedToken;

      const databricksResult = defaultTableNameParser(databricksToken);

      expect(databricksResult).toEqual({
        catalog: 'hive',
        schema: 'default',
        table: 'customer_data',
      });

      // BigQuery example
      const bigQueryToken = {
        value: 'project.dataset.table',
      } as LinkedToken;

      const bigQueryResult = defaultTableNameParser(bigQueryToken);

      expect(bigQueryResult).toEqual({
        catalog: 'project',
        schema: 'dataset',
        table: 'table',
      });
    });
  });
});
