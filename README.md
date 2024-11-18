# plugin-ui

React components for Grafana plugins

## Datasource Query and Config editor component compatibility

Version 1.0.0 of plugin-ui is compatible with Grafana versions 10.4.0 and higher. If you're using plugin-ui@1.0.0 and importing Query Editor and Config Editor components, you must update the `grafanaDependency` field in your plugin.json file. 
When you do that, consider also incrementing you plugin major version to make sure Grafana users do not accidentally install a version incompatible with their earlier Grafana versions. 

## Compatibility

There are situations when we require backwards compatibility with core Grafana and new features are only supported by newer versions.

To handle this, we've introduced the `compatibility.ts` file which contains a list of features and the versions they support for better maintainability.


### Considerations

The way we are currently checking whether a feature is supported is by using the Grafana's [BuildInfo](https://grafana.com/docs/grafana/latest/packages_api/data/buildinfo/#version-property).

However, there are cases when this version [may be masked](https://grafana.com/docs/grafana/latest/packages_api/data/buildinfo/#hideversion-property) from plugins.

Only anonymous users (with read-only access) will be able to have their versions hidden, so this should be taken into consideration when deciding whether we should be adding a new feature to our compatibility list.

## Storybook

```
yarn storybook
```
