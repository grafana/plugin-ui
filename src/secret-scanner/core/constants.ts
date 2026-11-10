/**
 * How long to wait after the last edit before re-scanning. A scan runs every
 * detector over the whole document (and, for code scans, re-parses it), so
 * running it on every keystroke blocks typing. Debouncing coalesces a burst of
 * edits into one scan.
 */
export const DEFAULT_DEBOUNCE_MS = 1500;
