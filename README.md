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

## Dependency structure

### Why `react` and `react-dom` must stay in `peerDependencies`

`react` and `react-dom` **must** be declared in `peerDependencies` and must never appear only in `devDependencies`.

This package is built with Rollup using `rollup-plugin-node-externals({ deps: true, peerDeps: true })`.
That plugin externalizes packages listed in `dependencies` and `peerDependencies` — anything else gets
bundled into the dist output.

React is not imported by this package directly, but it is resolved transitively through bundled
dependencies (`react-use`, `react-calendar`, `react-popper-tooltip`, etc.). Because Rollup resolves
CJS packages via `@rollup/plugin-commonjs`, any transitively-resolved React that is not marked
external ends up inlined as `dist/esm/node_modules/react/` in the published bundle.

When a Grafana plugin consumes this package, its webpack build follows those relative-path imports
(`_virtual/index.js → node_modules/react/index.js`) and produces **two React instances** in the
final bundle:

1. Grafana's host React — loaded as an AMD external by `react-dom`
2. The inlined copy from this package

React's hook dispatcher is a singleton on the React instance. `react-dom` renders against instance 1,
but hooks called from this package's components use instance 2's dispatcher, which is `null` at
runtime. Every hook call (`useState`, `useEffect`, …) throws:

```
Cannot read properties of null (reading 'useState')
```

Keeping `react` and `react-dom` in `peerDependencies` is what causes `rollup-plugin-node-externals`
to externalize them, producing a clean dist with no inlined React.

## Deploying

Increment the version in the package.json and make sure the [CHANGELOG.md](CHANGELOG.md) includes a message for each merged PR. The `publish-npm` workflow should trigger on version changes, which will publish the release on npm.

## Grafana compatibility

`@grafana/plugin-ui@0.13.2` is compatible with Grafana versions 10.4.7 and higher. If the `grafanaDependency` field in your plugin.json file is set to an earlier version, you should amend it to `>=10.4.7`
When you do that, consider also incrementing your plugin's major version to make sure users on Grafana < 10.4.7 do not accidentally install an incompatible plugin version.

## Storybook

Storybook is pretty broken, components link to assets that only exist within Grafana, as such most components haven't bothered to add support for storybook.

```bash
yarn storybook
```
