/**
 * Secret scanner entry point, published as `@grafana/plugin-ui/secret-scanner`.
 *
 * Kept out of the root entry point on purpose: this module pulls in a JS parser
 * (acorn) and optional Monaco typings that consumers of the main component
 * library should not have to carry.
 *
 * @packageDocumentation
 */
export * from './secret-scanner/index';
