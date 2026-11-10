/**
 * Memoizes the latest input only — a scanner sees an evolving document, so anything older is not relevant.
 */
export function memoizeLatest<T>(compute: (input: string) => T[]): (input: string) => T[] {
  let lastInput: string | null = null;
  let lastResult: T[] = [];

  return (input: string) => {
    if (!input) {
      return [];
    }
    if (input === lastInput) {
      return lastResult;
    }
    lastInput = input;
    lastResult = compute(input);
    return lastResult;
  };
}
