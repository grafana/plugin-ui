/**
 * Minimal ambient typings for the `storybook/preview-api` subpath.
 *
 * Storybook resolves this subpath fine at build time (webpack honours the
 * package `exports` map), but this project's tsc `moduleResolution` is
 * `node10`, which cannot read `exports` conditions. This shim only declares
 * the hooks used by stories. Story files are excluded from the library build,
 * so this never leaks into the published types.
 */
declare module 'storybook/preview-api' {
  export function useArgs<TArgs = Record<string, unknown>>(): [
    TArgs,
    (updatedArgs: Partial<TArgs>) => void,
    (argNames?: string[]) => void,
  ];
}
