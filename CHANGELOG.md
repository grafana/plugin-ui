# Change Log

## 
- 2025-11-21

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
