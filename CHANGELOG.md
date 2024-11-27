# Change Log

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
