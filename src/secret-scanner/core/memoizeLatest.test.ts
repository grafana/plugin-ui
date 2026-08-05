import { describe, it, expect } from '@jest/globals';

import { memoizeLatest } from './memoizeLatest';

describe('memoizeLatest', () => {
  it('recomputes only when the input changes', () => {
    let calls = 0;
    const memoized = memoizeLatest((input: string) => {
      calls++;
      return [input];
    });

    expect(memoized('a')).toEqual(['a']);
    expect(memoized('a')).toEqual(['a']);
    expect(calls).toBe(1);

    expect(memoized('b')).toEqual(['b']);
    expect(calls).toBe(2);
  });

  it('returns the identical array reference on a cache hit', () => {
    const memoized = memoizeLatest((input: string) => [input]);

    expect(memoized('a')).toBe(memoized('a'));
  });

  it('short-circuits empty input without calling through', () => {
    let calls = 0;
    const memoized = memoizeLatest((input: string) => {
      calls++;
      return [input];
    });

    expect(memoized('')).toEqual([]);
    expect(calls).toBe(0);
  });

  it('gives each instance its own cache, so two surfaces do not evict each other', () => {
    let calls = 0;
    const compute = (input: string) => {
      calls++;
      return [input];
    };
    const first = memoizeLatest(compute);
    const second = memoizeLatest(compute);

    first('a');
    second('b');
    calls = 0;

    first('a');
    second('b');
    expect(calls).toBe(0);
  });
});
