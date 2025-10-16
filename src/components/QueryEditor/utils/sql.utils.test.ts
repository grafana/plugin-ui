import { toRawSql, haveColumns } from './sql.utils';
import { type SQLQuery, type SQLExpression } from '../types';
import { QueryEditorExpressionType, QueryEditorPropertyType, type QueryEditorFunctionExpression } from '../expressions';

describe('sql.utils', () => {
  describe('toRawSql', () => {
    const baseExpression: SQLExpression = {
      columns: [
        {
          type: QueryEditorExpressionType.Function,
          name: undefined,
          parameters: [
            {
              type: QueryEditorExpressionType.FunctionParameter,
              name: '*',
            },
          ],
        },
      ],
    };

    describe('catalog, schema, and table handling', () => {
      it('should generate FROM clause with catalog.schema.table when all three are provided', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'samples',
          schema: 'taxi',
          table: 'trips',
          sql: {
            ...baseExpression,
            limit: 50,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM samples.taxi.trips LIMIT 50 ');
      });

      it('should generate FROM clause with only table when schema exists without catalog', () => {
        const query: SQLQuery = {
          refId: 'A',
          schema: 'public', // Schema without catalog should be ignored
          table: 'users',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        // Schema is only used with catalog, so this should just use table name
        expect(result).toBe('SELECT * FROM users ');
      });

      it('should generate FROM clause with dataset.table for backwards compatibility', () => {
        const query: SQLQuery = {
          refId: 'A',
          dataset: 'dataset',
          table: 'table',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM dataset.table ');
      });

      it('should use catalog.schema.table when all three are provided (catalog takes precedence over dataset)', () => {
        const query: SQLQuery = {
          refId: 'A',
          dataset: 'old_dataset', // This should be ignored when catalog/schema are present
          catalog: 'new_catalog',
          schema: 'new_schema',
          table: 'users',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        // Catalog.schema.table takes precedence - dataset is ignored
        expect(result).toBe('SELECT * FROM new_catalog.new_schema.users ');
      });

      it('should generate FROM clause with only table when only table is provided', () => {
        const query: SQLQuery = {
          refId: 'A',
          table: 'users',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM users ');
      });

      it('should not generate FROM clause when table is missing', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'samples',
          schema: 'taxi',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * ');
      });

      it('should handle catalog and table without schema (fallback to table only)', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'main',
          table: 'table',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        // Should fall back to just table since we need both catalog and schema for three-part naming
        expect(result).toBe('SELECT * FROM table ');
      });

      it('should ignore schema when dataset is present (mutually exclusive)', () => {
        const query: SQLQuery = {
          refId: 'A',
          dataset: 'dataset',
          schema: 'public', // Schema should be ignored when used without catalog
          table: 'table',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        // Schema without catalog is ignored, dataset.table is used
        expect(result).toBe('SELECT * FROM dataset.table ');
      });
    });

    describe('disableDatasets flag', () => {
      it('should use catalog.schema.table even when disableDatasets is true (catalogs take precedence)', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'samples',
          schema: 'taxi',
          table: 'trips',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, true);

        // Catalog.schema.table should work regardless of disableDatasets flag
        expect(result).toBe('SELECT * FROM samples.taxi.trips ');
      });

      it('should not include dataset when disableDatasets is true (only affects datasets, not catalogs)', () => {
        const query: SQLQuery = {
          refId: 'A',
          dataset: 'dataset',
          table: 'table',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, true);

        expect(result).toBe('SELECT * FROM table ');
      });

      it('should use only table name when disableDatasets is true and no catalog/schema', () => {
        const query: SQLQuery = {
          refId: 'A',
          table: 'table',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, true);

        expect(result).toBe('SELECT * FROM table ');
      });

      it('should use catalog.schema.table when disableDatasets is false and all are provided', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'samples',
          schema: 'sales',
          table: 'customer',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        // This is the Unity Catalog use case
        expect(result).toBe('SELECT * FROM samples.sales.customer ');
      });
    });

    describe('complete query generation', () => {
      it('should generate a complete query with all clauses using catalog.schema.table', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'production',
          schema: 'analytics',
          table: 'events',
          sql: {
            columns: [
              {
                type: QueryEditorExpressionType.Function,
                name: 'COUNT',
                parameters: [
                  {
                    type: QueryEditorExpressionType.FunctionParameter,
                    name: 'id',
                  },
                ],
              },
            ],
            whereString: "status = 'active'",
            groupBy: [
              {
                type: QueryEditorExpressionType.GroupBy,
                property: {
                  type: QueryEditorPropertyType.String,
                  name: 'category',
                },
              },
            ],
            orderBy: {
              type: QueryEditorExpressionType.Property,
              property: {
                type: QueryEditorPropertyType.String,
                name: 'category',
              },
            },
            orderByDirection: 'ASC',
            limit: 100,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe(
          "SELECT COUNT(id) FROM production.analytics.events WHERE status = 'active' GROUP BY category ORDER BY category ASC LIMIT 100 "
        );
      });

      it('should handle multiple columns', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'db',
          schema: 'public',
          table: 'users',
          sql: {
            columns: [
              {
                type: QueryEditorExpressionType.Function,
                name: undefined,
                parameters: [
                  {
                    type: QueryEditorExpressionType.FunctionParameter,
                    name: 'id',
                  },
                ],
              },
              {
                type: QueryEditorExpressionType.Function,
                name: undefined,
                parameters: [
                  {
                    type: QueryEditorExpressionType.FunctionParameter,
                    name: 'name',
                  },
                ],
              },
            ],
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT id, name FROM db.public.users ');
      });

      it('should handle query with WHERE but no GROUP BY or ORDER BY', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'main',
          schema: 'public',
          table: 'table',
          sql: {
            ...baseExpression,
            whereString: 'age > 18',
            limit: 10,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM main.public.table WHERE age > 18 LIMIT 10 ');
      });

      it('should handle multiple GROUP BY fields', () => {
        const query: SQLQuery = {
          refId: 'A',
          dataset: 'sales', // Changed from schema to dataset
          table: 'orders',
          sql: {
            ...baseExpression,
            groupBy: [
              {
                type: QueryEditorExpressionType.GroupBy,
                property: {
                  type: QueryEditorPropertyType.String,
                  name: 'region',
                },
              },
              {
                type: QueryEditorExpressionType.GroupBy,
                property: {
                  type: QueryEditorPropertyType.String,
                  name: 'category',
                },
              },
            ],
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM sales.orders GROUP BY region, category ');
      });
    });

    describe('edge cases', () => {
      it('should return empty string when sql is undefined', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'samples',
          schema: 'taxi',
          table: 'trips',
        };

        const result = toRawSql(query, false);

        expect(result).toBe('');
      });

      it('should return empty string when columns are undefined', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'samples',
          schema: 'taxi',
          table: 'trips',
          sql: {},
        };

        const result = toRawSql(query, false);

        expect(result).toBe('');
      });

      it('should handle limit of 0', () => {
        const query: SQLQuery = {
          refId: 'A',
          table: 'users',
          sql: {
            ...baseExpression,
            limit: 0,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM users LIMIT 0 ');
      });

      it('should not include limit when undefined', () => {
        const query: SQLQuery = {
          refId: 'A',
          table: 'users',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM users ');
      });

      it('should handle special characters in table names', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'my-catalog',
          schema: 'my_schema',
          table: 'my.table',
          sql: {
            ...baseExpression,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM my-catalog.my_schema.my.table ');
      });
    });

    describe('real-world examples', () => {
      it('should generate correct query for Databricks three-part naming', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'hive',
          schema: 'default',
          table: 'customer_data',
          sql: {
            columns: [
              {
                type: QueryEditorExpressionType.Function,
                name: 'COUNT',
                parameters: [
                  {
                    type: QueryEditorExpressionType.FunctionParameter,
                    name: '*',
                  },
                ],
              },
            ],
            limit: 1000,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT COUNT(*) FROM hive.default.customer_data LIMIT 1000 ');
      });

      it('should generate correct query for BigQuery-style naming', () => {
        const query: SQLQuery = {
          refId: 'A',
          catalog: 'project-name',
          schema: 'dataset_name',
          table: 'table_name',
          sql: {
            ...baseExpression,
            limit: 100,
          },
        };

        const result = toRawSql(query, false);

        expect(result).toBe('SELECT * FROM project-name.dataset_name.table_name LIMIT 100 ');
      });
    });
  });

  describe('haveColumns', () => {
    it('should return false when columns is undefined', () => {
      expect(haveColumns(undefined)).toBe(false);
    });

    it('should return true when columns have parameters with names', () => {
      const columns: QueryEditorFunctionExpression[] = [
        {
          type: QueryEditorExpressionType.Function,
          name: undefined,
          parameters: [
            {
              type: QueryEditorExpressionType.FunctionParameter,
              name: 'id',
            },
          ],
        },
      ];

      expect(haveColumns(columns)).toBe(true);
    });

    it('should return true when columns have function names', () => {
      const columns: QueryEditorFunctionExpression[] = [
        {
          type: QueryEditorExpressionType.Function,
          name: 'COUNT',
          parameters: [],
        },
      ];

      expect(haveColumns(columns)).toBe(true);
    });

    it('should return false when columns are empty', () => {
      expect(haveColumns([])).toBe(false);
    });
  });
});
