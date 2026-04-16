import { formatSQL } from './formatSQL';

describe('formatSQL', () => {
  it('formats Grafana template tokens', () => {
    const query = 'select ${foo} as value where $__timeFilter(time) and $bar = 1 and $ { baz } = 2';

    expect(formatSQL(query)).toMatchSnapshot();
  });

  it('formats complex queries', () => {
    const query = 'select a, count(*) from my_table where $__timeFrom() and $var = 1 group by a order by a';

    expect(formatSQL(query)).toMatchSnapshot();
  });

  it('preserves Grafana template tokens with a non-default language', () => {
    const query = 'select ${foo} from my_table where $__timeFilter(time) and $var = 1';
    const result = formatSQL(query, 'postgresql');

    expect(result).toContain('${foo}');
    expect(result).toContain('$__timeFilter(time)');
    expect(result).toContain('$var');
  });

  it('handles dialect-specific syntax with the appropriate language', () => {
    // PostgreSQL :: cast operator causes a parse error in the default 'sql' dialect.
    // Passing language='postgresql' allows it to format correctly.
    const query = 'SELECT id::text FROM users WHERE $__timeFilter(time)';

    expect(() => formatSQL(query, 'sql')).toThrow();
    expect(() => formatSQL(query, 'postgresql')).not.toThrow();
    expect(formatSQL(query, 'postgresql')).toContain('id::text');
    expect(formatSQL(query, 'postgresql')).toContain('$__timeFilter(time)');
  });
});
