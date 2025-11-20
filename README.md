# plugin-ui

React components for Grafana plugins

## Development
Requires running a local version of Grafana from source.
### Setting up local version of @grafana/plugin-ui with app plugin

1. Run `yarn install && yarn dev`
1. Run `yarn link ../path/to/plugin-ui` from app plugin directory. Make sure not to commit the changes to grafana/grafana that are introduced to the package.json.
1. Start app plugin development server.

To avoid needing to manually rebuild core grafana on every change you make in this repo while developing, instead of running `yarn dev`, run
```bash
yarn tsc -p ./tsconfig.build.json && yarn rollup -c rollup.config.ts --configPlugin esbuild -w --watch.onEnd="cd ../grafana/public/app/plugins/datasource/loki && yarn build
```
Replacing the --watch.onEnd command with whatever you are targeting.

There is a better way of doing this, when you find it, please add it here so it's not so painful working with this repo.

## Grafana compatibility

Plugin-ui@0.9.0 is compatible with Grafana versions 10.4.0 and higher. If the `grafanaDependency` field in your plugin.json file is set to an earlier version, you should amend it to `>=10.4.0`
When you do that, consider also incrementing your plugin's major version to make sure users on Grafana < 10.4.0 do not accidentally install an incompatible plugin version.

## Storybook

Storybook is pretty broken, components link to assets that only exist within Grafana, as such most components haven't bothered to add support for storybook.
```
yarn storybook
```
