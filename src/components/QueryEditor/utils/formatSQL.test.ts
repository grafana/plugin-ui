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
});
