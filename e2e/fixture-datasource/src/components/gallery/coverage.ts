import coverage from './coverage.json';

/**
 * SINGLE SOURCE OF TRUTH for e2e component coverage.
 *
 * The plain string arrays live in `coverage.json` so they can be consumed by
 * three different runtimes without pulling in React or TypeScript-only code:
 *   1. The gallery React components (via this module).
 *   2. The Playwright specs in `e2e/tests/*` (via this module).
 *   3. The Node drift-guard `scripts/check-coverage.mjs` (reads the JSON directly).
 *
 * Each entry is the exact export name from `@grafana/plugin-ui` and is used
 * verbatim as the component's `data-testid` (e.g. `<GalleryItem id="Space">`).
 */

/** Export names rendered inside the ConfigEditor gallery. */
export const CONFIG_COVERED: string[] = coverage.CONFIG_COVERED;

/** Export names rendered inside the QueryEditor gallery. */
export const QUERY_COVERED: string[] = coverage.QUERY_COVERED;

/** Every rendered export (config + query). */
export const COVERED_EXPORTS: string[] = [...CONFIG_COVERED, ...QUERY_COVERED];

/** Non-visual exports intentionally skipped by the gallery. */
export const IGNORED_EXPORTS: string[] = coverage.IGNORED_EXPORTS;
