# plugin-ui

React components for Grafana plugins

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
