import { type DataSourceInstanceSettings, type ScopedVars } from '@grafana/data';
import { type TemplateSrv } from '@grafana/runtime';

import { type SQLOptions, type SQLQuery, type SqlQueryModel } from '../components/QueryEditor/types';
import { SqlDatasource, type VariableWithMultiSupport } from './SqlDatasource';

const quoteLiteral = (value: string) => `'${value.replace(/'/g, "''")}'`;

const variables: Record<string, { value: string | string[]; multi: boolean }> = {
  single: { value: "O'Brien", multi: false },
  multi: { value: ["O'Brien", 'Smith'], multi: true },
};

// Replaces `$name` with the datasource's formatted value, like TemplateSrv does for a format callback.
const templateSrv = {
  replace: (target: string, _scopedVars: ScopedVars, format: Function) =>
    target.replace(/\$(\w+)/g, (match, name) => {
      const variable = variables[name];
      return variable ? format(variable.value, { multi: variable.multi, includeAll: false }) : match;
    }),
} as unknown as TemplateSrv;

class TestSqlDatasource extends SqlDatasource {
  getDB() {
    return {} as ReturnType<SqlDatasource['getDB']>;
  }

  getResponseParser() {
    return {} as ReturnType<SqlDatasource['getResponseParser']>;
  }

  getQueryModel(target?: SQLQuery, templateSrv?: TemplateSrv, scopedVars?: ScopedVars): SqlQueryModel {
    return {
      quoteLiteral,
      interpolate: () => templateSrv!.replace(target!.rawSql, scopedVars, this.interpolateVariable),
    };
  }
}

const instanceSettings = { jsonData: {} } as unknown as DataSourceInstanceSettings<SQLOptions>;

const variable = (multi: boolean) => ({ multi, includeAll: false }) as VariableWithMultiSupport;

describe('SqlDatasource', () => {
  let ds: TestSqlDatasource;

  beforeEach(() => {
    ds = new TestSqlDatasource(instanceSettings, templateSrv);
  });

  describe('applyTemplateVariables', () => {
    const rawSqlFor = (rawSql: string) => ds.applyTemplateVariables({ refId: 'A', rawSql }, {}).rawSql;

    it('keeps escaped quotes in string literals', () => {
      expect(rawSqlFor("SELECT 'it''s working'")).toBe("SELECT 'it''s working'");
    });

    it('keeps empty string literals', () => {
      expect(rawSqlFor("SELECT * FROM t WHERE a = '' AND b = 'x'")).toBe("SELECT * FROM t WHERE a = '' AND b = 'x'");
    });

    it('keeps the escaping of a single-value variable', () => {
      expect(rawSqlFor("SELECT * FROM t WHERE name = '$single'")).toBe("SELECT * FROM t WHERE name = 'O''Brien'");
    });

    it('keeps the escaping of a multi-value variable', () => {
      expect(rawSqlFor('SELECT * FROM t WHERE name IN ($multi)')).toBe(
        "SELECT * FROM t WHERE name IN ('O''Brien','Smith')"
      );
    });
  });

  describe('interpolateVariable', () => {
    it('escapes single quotes in a single-value string', () => {
      expect(ds.interpolateVariable("O'Brien", variable(false))).toBe("O''Brien");
    });

    it('quotes a multi-value string', () => {
      expect(ds.interpolateVariable("O'Brien", variable(true))).toBe("'O''Brien'");
    });

    it('quotes and joins an array of values', () => {
      expect(ds.interpolateVariable(["O'Brien", 'Smith'], variable(true))).toBe("'O''Brien','Smith'");
    });

    it('returns numbers unchanged', () => {
      expect(ds.interpolateVariable(42, variable(false))).toBe(42);
    });
  });

  describe('clean', () => {
    it('still collapses doubled single quotes for callers that use it', () => {
      expect(ds.clean("'it''s'")).toBe("'it's'");
    });
  });
});
