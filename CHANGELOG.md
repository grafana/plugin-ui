# Change Log

## v0.17.2 - 2026-07-21

- Added tracking events to `DatasourceConfigWizard` component
- Export provisioning scripts from dsconfig/schema

## v0.17.1 - 2026-07-16

- Added new `DatasourceConfigWizard` component ( schema driven config page )

## v0.17.0 - 2026-07-15

### Note

- The `@grafana/*` dev dependencies were upgraded from `10.4.19` to `13.1.0`. The code is now built and tested against Grafana versions back to 10.4.x. Consumers on Grafana < 13 should stay on `0.16.x` if they experience issues with this version of the library.

### Changed

- Relaxed `peerDependencies` from exact pins to compatibility ranges: `@grafana/*` is now `^13.0.0`, `react`/`react-dom` are `^18.0.0 || ^19.0.0`, and the `@testing-library/*` peers use caret ranges. This lets consumers dedupe against their own Grafana/React versions instead of being forced onto an exact patch. Renovate is now configured to leave `peerDependencies` alone so it won't re-pin them.
- Replaced the removed `HorizontalGroup` component with `Stack` in `QueryToolbox`, `DataSourcePicker`, and `SecretTextArea` (no public API change).
- Replaced the deprecated `InfoBox` with `Alert` in Storybook stories.
- Added `aria-label`s to icon-only `Button`/`IconButton` usages and an `ariaLabel` to the custom-title `Modal` in `ConfirmModal`, as required by Grafana 13's stricter accessibility types.
- Reworked the datasource-config schema registry: `getConfigSchema` now resolves a plugin's schema from `/public/plugins/{pluginType}/schema/dsconfig.json` and falls back to the shared `grafana/dsconfig` registry when the plugin does not bundle one, returning an empty schema if neither is available. The bundled static schema JSON files were removed from the package, considerably reducing its size.
- Testing: added an `IntersectionObserver` mock and taught Jest's `transformIgnorePatterns` to transform Grafana 13's nested ES-module dependencies.

### Removed

- Removed the bundled static schema registry and its exports (`getStaticConfigSchema`, `staticSchemaRegistry`, `getConfigSchemaUrl`) along with the per-datasource `*.schema.json` files. Consumers should rely on `getConfigSchema`, which now fetches schemas at runtime.

### Added

- End-to-end tests: added a Playwright suite that runs against a fixture datasource, wired up in CI via a new `e2e` workflow.
- Published the component Storybook to GitHub Pages.

### Dependencies

- Updated dev/tooling dependencies, including `typescript-eslint` v8, the `testing-library` monorepo, `lefthook` v2, `rollup-plugin-node-externals` v9, `@stylistic/eslint-plugin-ts` v4, `@types/testing-library__jest-dom` v6, and Node.js 24.16.0.

## v0.16.1 - 2026-06-18

- Improve styling of `TLSClientAuth` components

## v0.16.0 - 2026-06-18

- Added schema for datasource configuration

## v0.15.1 - 2026-06-16

- Fix: add `react` and `react-dom` back to `peerDependencies`; omitting them caused the Rollup build to inline a second copy of React into the published bundle, breaking all hook calls in plugins that consume this package.

## v0.15.0 - 2026-06-09

- Fix some `@grafana/*` dependencies incorrectly listed as `dependencies` instead of `devDependencies`
- Remove unused dependencies

## v0.14.0 - 2026-06-05

- Added/Moved components from [`@grafana/async-query-data`](https://www.npmjs.com/package/@grafana/async-query-data) package from [https://github.com/grafana/grafana-async-query-data-js](https://github.com/grafana/grafana-async-query-data-js)

## v0.13.2 - 2026-05-28

- Remove unused devDependencies: `copyfiles`, `fast-glob`, `@types/memoize-one`. Reduces supply-chain surface.
- Replace `sql-formatter-plus` with `sql-formatter` for actively maintained SQL formatting.
- Add `language` prop to `SqlQueryEditor`, `RawEditor`, `QueryEditorRaw`, `VisualEditor`, and `Preview` to support dialect-specific formatting (e.g. `postgresql`, `mysql`, `bigquery`). Defaults to `'sql'` for backward compatibility.

## v0.13.1 - 2026-02-10

- Replace defaultProps with es6 defaults for React 19 compatibility

## v0.13.0 - 2026-02-05

- Revert jsx option in tsconfig.json for smoother upgrade path to React 19.
- Prevent bundling @testing-library and chance.
- Export test related mocks and utils from `@grafana/plugin-ui/test`.
- Use publint to assert package.json and expected entrypoint files exist.

### Breaking Change

The test mocks and utils are no longer available for import from `@grafana/plugin-ui`. Import statements should be updated to use `@grafana/plugin-ui/test`.

## v0.12.1 - 2025-12-30

- Updated dependencies

## v0.12.0 - 2025-11-21

- Fix styles in `QueryOptionGroup`

## v0.11.1 - 2025-10-17

- Fix catalog support in `SqlQueryEditor`

## v0.11.0 - 2025-10-06

- Add support for catalog and schema fields in `SqlQueryEditor`

## v0.10.10 - 2025-08-27

- Fix stale closure in SQLEditor component

## v0.10.9 - 2025-08-07

- Optimize `QueryBuilderHints` to not trigger a state update immediately on mount

## v0.10.8 - 2025-08-05

- Fix `AccessoryButtonProps` type

## v0.10.7 - 2025-06-18

- Fix `onChange` type in `SecureSocksProxyToggle`

## v0.10.6 - 2025-05-16

- Update releasing

## v0.10.5 - 2025-04-07

- Relax peer dependencies to work with dependencies `=> 10.4.0`

## v0.10.4 - 2025-02-19

- Use `import` instead of `require` in SQL language definition

## v0.10.3 - 2025-02-04

- Re-add `generateOptions` mock helper

## v0.10.2 - 2025-02-04

- Re-add test mock exports

## v0.10.1 - 2025-01-30

- Fix commonjs resolution errors due to incorrect paths in package.json
- Bump UUID dependency to ^11.0.0

## v0.10.0 - 2025-01-30

- Remove AsyncButtonCascader, Cascader, InlineSwitch and CertificationKey components
- Introduce ESM and CJS builds
- Relax semver versions for various dependencies
- Migrate to Yarn Berry

## v0.9.6 - 2025-01-20

- Fix `Config` type to be compatible with `DataSourceSettings`

## v0.9.5 - 2025-01-16

- Query Builder: Add support to disable operations

## v0.9.4 - 2024-12-18

- Auth: Make AuthMethodSettings select more Playwright friendly.

## v0.9.3 - 2024-12-13

- Make Auth component to be usable by plugins

## v0.9.2 - 2024-11-27

- Fix a bug in the SQLEditor component that caused autocomplete and syntax highlighting to not work

## v0.9.1 - 2024-11-25

- Remove unused dependencies

## v0.9.0 - 2024-11-25

- Add unit testing infrastructure and script [#98](https://github.com/grafana/plugin-ui/pull/98)
- Add linting infrastructure and bump node version to 20 [#99](https://github.com/grafana/plugin-ui/pull/99)
- Add VisualQueryBuilder from grafana/experimental [#100](https://github.com/grafana/plugin-ui/pull/100)
- Improve build and lint scripts, add prettier and pre-commit hook [#101](https://github.com/grafana/plugin-ui/pull/101)
- Chore: Relax peer dependencies [#102](https://github.com/grafana/plugin-ui/pull/102)
- Move config editor components from grafana/experimental [#103](https://github.com/grafana/plugin-ui/pull/103)
- Migrate SQL editor from grafana/experimental [#104](https://github.com/grafana/plugin-ui/pull/104)
- Migrate Query Editor components from grafana/experimental [#105](https://github.com/grafana/plugin-ui/pull/105)
- Remove compatibility feature and unused code for Grafana@8 [#107](https://github.com/grafana/plugin-ui/pull/107)

## v0.8.0 - 2024-07-30

- ⚙️ **Chore**: Update `@grafana` dependencies from v9 to `10.4.0` and make them peerDependencies and devDependencies
- ⚙️ **Chore**: Update `react` to `18.2.0`
- ⚙️ **Chore**: **BREAKING**: Remove SecretInput and SecretTextArea components, use these components from @grafana/ui

## v0.7.0 - 2024-04-30

- ⚙️ **Chore**: changing the QueryFormat enum to match grafana's sqlds and sqlutil constant values

## v0.6.3 - 2024-04-15

- ⚙️ **Chore**: allow datasets to be disabled in the sql query editor

## v0.6.2 - 2024-02-02

- ⚙️ **Chore**: better type checks for DB.labels

## v0.6.1 - 2024-01-09

- 🐛 **Fix**: moving user_event library from dev-dependencies to dependencies

## v0.6.0 - 2023-10-25

- ⚙️ **Chore**: **BREAKING**: Remove e2e related functionality

## v0.5.0 - 2023-10-24

- ⚙️ **Chore**: Update `@grafana` dependencies from v8 to latest v9
