# End-to-end component validation

This harness validates that `@grafana/plugin-ui` components actually **load and
render inside real Grafana**, across the range of Grafana versions the library
declares support for.

Unlike the Jest suite (jsdom + mocked `@grafana/ui`), this runs the *published*
package inside a real Grafana runtime, so it catches:

- removed/renamed `@grafana/ui` exports at runtime,
- the actual React version each Grafana ships (plugins consume Grafana's React,
  they don't pick their own),
- real theme tokens / CSS-in-JS and DOM structure.

## How it works

1. The library is built and packed into a tarball with `npm pack`. Use `npm`,
   not `yarn pack` — Yarn Berry strips nested `node_modules`, which drops the ESM
   build's vendored deps (`dist/esm/node_modules/*`) and breaks the heavy
   components; `npm pack` keeps them, matching how the package is published.
2. `fixture-datasource/` is a minimal **data source plugin** whose `ConfigEditor`
   and `QueryEditor` are built entirely from `@grafana/plugin-ui` components.
   Each library component is wrapped in a `data-testid`.
3. `docker-compose.yaml` boots Grafana (version configurable) with the built
   fixture plugin mounted and unsigned-loading enabled.
4. Playwright + [`@grafana/plugin-e2e`](https://github.com/grafana/plugin-e2e)
   opens the config/query editors and asserts each component renders and is
   interactive.
5. In CI, [`grafana/plugin-actions/e2e-version`](https://github.com/grafana/plugin-actions/tree/main/e2e-version)
   resolves the Grafana version matrix, matching the strategy of the shared
   `grafana/plugin-ci-workflows` CI: the `plugin-grafana-dependency` resolver
   returns the `grafana-enterprise:nightly` image plus the latest patch of the
   (up to 6, the action default) most-recent minors satisfying `>=10.4.0`.

   > **Note:** because the cap is 6 most-recent minors, the `>=10.4.0` floor
   > mainly sets eligibility — in practice the resolved set will be the newest
   > ~6 minors + nightly and won't reach all the way back to 10.4 while there are
   > more than 6 minors above it. `@grafana/plugin-ui` is built against Grafana 13
   > and declares `^13.0.0` peers, so older cells are a runtime-compatibility
   > probe; expect some to fail and treat them as informational until we settle
   > on the real support floor.

## Run locally

From the repo root:

```bash
# 1. Build + pack the library (npm pack, so the ESM build's vendored deps ship)
yarn install --immutable
yarn build
npm pack && mv grafana-plugin-ui-*.tgz plugin-ui.tgz

# 2. Build the fixture plugin against the packed library.
#    `--legacy-peer-deps` is required because the published library pins its
#    react/@grafana/* peers to exact versions that don't match the React 18 /
#    Grafana 10.4+ range the fixture builds against.
cd e2e/fixture-datasource
npm install --ignore-scripts --legacy-peer-deps
npm run build
cd ..

# 3. Boot Grafana (override version as desired)
GRAFANA_VERSION=13.1.0 docker compose up -d

# 4. Run the tests
npm install --ignore-scripts
npx playwright install --with-deps chromium
npx playwright test
```

Point at a different Grafana version by changing `GRAFANA_VERSION` (and
`GRAFANA_IMAGE`, default `grafana-enterprise`).

## Adding coverage

When you export a new component from the library, render it (wrapped in a
`data-testid`) in `fixture-datasource/src/components/ConfigEditor.tsx` or
`QueryEditor.tsx` and add an assertion to the matching spec in `tests/`.

## Notes / limitations

- The fixture is frontend-only (`backend: false`); the data source never queries
  a real backend.
- Tests use functional/role assertions. Visual snapshots (`toHaveScreenshot`)
  are intentionally omitted for now — they'd need per-Grafana-version baselines.
- The `nightly` matrix entry tracks a moving target; consider marking it
  non-blocking if it proves flaky.
