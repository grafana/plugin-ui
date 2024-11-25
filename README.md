# plugin-ui

React components for Grafana plugins

## Grafana compatibility

Plugin-ui@0.9.0 is compatible with Grafana versions 10.4.0 and higher. If the `grafanaDependency` field in your plugin.json file is set to an earlier version, you should amend it to `>=10.4.0`
When you do that, consider also incrementing your plugin's major version to make sure users on Grafana < 10.4.0 do not accidentally install an incompatible plugin version.

## Storybook

```
yarn storybook
```
