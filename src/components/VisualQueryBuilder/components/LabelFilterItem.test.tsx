import { isConflictingLabelFilter } from "./LabelFilterItem";

describe('isConflictingSelector', () => {
  it('returns true if selector is conflicting', () => {
    const newLabel = { label: 'job', op: '!=', value: 'tns/app' };
    const labels = [
      { label: 'job', op: '=', value: 'tns/app' },
      { label: 'job', op: '!=', value: 'tns/app' },
    ];
    expect(isConflictingLabelFilter(newLabel, labels)).toBe(true);
  });

  it('returns false if selector is not complete', () => {
    const newLabel = { label: 'job', op: '', value: 'tns/app' };
    const labels = [
      { label: 'job', op: '=', value: 'tns/app' },
      { label: 'job', op: '', value: 'tns/app' },
    ];
    expect(isConflictingLabelFilter(newLabel, labels)).toBe(false);
  });

  it('returns false if selector is not conflicting', () => {
    const newLabel = { label: 'host', op: '=', value: 'docker-desktop' };
    const labels = [
      { label: 'job', op: '=', value: 'tns/app' },
      { label: 'host', op: '=', value: 'docker-desktop' },
    ];
    expect(isConflictingLabelFilter(newLabel, labels)).toBe(false);
  });
});
