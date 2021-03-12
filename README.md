# ui-enterprise

React components for Grafana Enterprise plugins

## Unreleased Components

Sometimes we may want improvements/updates of `@grafana/ui` components but we don't want to update the minimum required versions of Grafana in our plugins and continue supporting older versions.

To work around this, we can import and export the version of the component we want from `@grafana/ui` in this project. Plugins can then use the component exported from here rather than `@grafana/ui`.

If updates to a component in `@grafana/ui` are available in `master` but not a Grafana release yet, we can copy the components directly into `unreleasedComponents` to be used in plugins.

Alternatively, we could use the `@grafana/ui: canary` version instead. However, there are the following tradeoffs:

- Multiple `canary` versions will be released in-between `@grafana/ui` releases

  - This means in-between these release cycles where the component changes aren't available in a package version, the `yarn.lock` file will need to be updated for every change we make in this project

- `canary` versions include `@grafana/ui: master` branch
  - This means component changes in the `master` branch which aren't scheduled for the next major release will be included in the `canary` package.
  - For example, we have changes in `<ComponentA />` that won't be released until `v7.5.x` and `<ComponentB />` has changes which are intended to be released for `v7.6`. Using `canary` of `@grafana/ui` will expose the `<ComponentB />` major updates too, which we do not want.

Once a `@grafana/ui` package is then released and available with the component updates, we can remove the component from this folder and export the imported version from the new `@grafana/ui` package instead.

This means any component in `unreleasedComponents` should not be modified - they should stay in sync with what is in `@grafana/ui` (besides changes in imports or stories) and removed from this project as soon as we can replace it with an actual package version.

## Storybook

```
yarn storybook
```
