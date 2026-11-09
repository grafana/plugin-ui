/**
 * Converts a character offset into a 1-based {line, column}.
 */
export function offsetToPosition(text: string, offset: number) {
  let line = 1;
  let column = 1;
  const end = Math.min(offset, text.length);

  for (let i = 0; i < end; i++) {
    if (text[i] === '\n') {
      line++;
      column = 1;
    } else {
      column++;
    }
  }

  return { line, column };
}

/**
 * Builds a reusable offset→{line, column} resolver for one document.
 */
export function createPositionResolver(text: string) {
  // lineStarts[i] = offset where line (i + 1) begins. Line 1 starts at 0.
  const lineStarts = [0];
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '\n') {
      lineStarts.push(i + 1);
    }
  }

  return function positionAt(offset: number) {
    const target = Math.min(Math.max(offset, 0), text.length);
    let lo = 0;
    let hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid]! <= target) {
        lo = mid;
      } else {
        hi = mid - 1;
      }
    }
    return { line: lo + 1, column: target - lineStarts[lo]! + 1 };
  };
}
