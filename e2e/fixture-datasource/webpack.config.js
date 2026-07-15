// Minimal webpack config for a Grafana data source plugin.
//
// The important part is `externals`: Grafana's plugin loader (SystemJS/AMD)
// provides React, RxJS, Emotion and every `@grafana/*` package at runtime, so
// those must NOT be bundled — the plugin has to use the *host Grafana's* copies
// (this is exactly why the fixture validates real React/`@grafana/ui` versions).
//
// `@grafana/plugin-ui` is deliberately NOT externalized: it is the library under
// test, so it gets bundled into module.js while its own imports of `@grafana/ui`
// etc. resolve to the externals above.
//
// This mirrors what `@grafana/create-plugin` generates. If it drifts from
// Grafana's loader expectations, prefer regenerating via `@grafana/create-plugin`.

const path = require('node:path');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const pluginJson = require('./src/plugin.json');

const GRAFANA_MODULES = [
  'react',
  'react-dom',
  'react-router',
  'react-router-dom',
  'react-redux',
  'redux',
  'rxjs',
  'lodash',
  'moment',
  'd3',
  '@emotion/css',
  '@emotion/react',
];

module.exports = (env = {}) => {
  const isProduction = Boolean(env.production);

  return {
    mode: isProduction ? 'production' : 'development',
    target: 'web',
    context: path.join(process.cwd(), 'src'),
    entry: {
      module: './module.ts',
    },
    devtool: isProduction ? 'source-map' : 'eval-source-map',
    output: {
      path: path.join(process.cwd(), 'dist'),
      filename: '[name].js',
      library: { type: 'amd' },
      publicPath: `public/plugins/${pluginJson.id}/`,
      uniqueName: pluginJson.id,
      clean: true,
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    },
    externalsType: 'amd',
    externals: [
      // Provided by the Grafana host at runtime.
      ...GRAFANA_MODULES,
      // Externalize every @grafana/* package EXCEPT the library under test.
      function ({ request }, callback) {
        if (request === '@grafana/plugin-ui' || request.startsWith('@grafana/plugin-ui/')) {
          return callback(); // bundle it
        }
        if (/^@grafana\/[a-z-]+(\/.*)?$/.test(request)) {
          return callback(null, `amd ${request}`);
        }
        return callback();
      },
    ],
    module: {
      rules: [
        {
          test: /\.[tj]sx?$/,
          exclude: /node_modules/,
          use: {
            loader: 'swc-loader',
            options: {
              jsc: {
                parser: { syntax: 'typescript', tsx: true },
                // Use the *classic* JSX runtime (React.createElement) rather than
                // the automatic one. The automatic runtime imports
                // `react/jsx-runtime`, which is NOT externalized above and would
                // therefore be bundled at the fixture's React 18. On a React 19
                // host (Grafana >=13, nightly) that bundled jsx-runtime crashes
                // on load because it reaches into `__SECRET_INTERNALS_*`, which
                // React 19 renamed. The classic runtime only touches the stable
                // `React.createElement`/`React.Fragment` API (every fixture file
                // already `import React from 'react'`), so the plugin loads
                // across the whole 10.4 -> nightly matrix on both React 18 and 19.
                // See https://grafana.com/developers/plugin-tools/migration-guides/update-from-grafana-versions/migrate-12_x-to-13_x
                transform: { react: { runtime: 'classic' } },
                target: 'es2020',
              },
            },
          },
        },
        // Some transitive deps of the library (e.g. react-calendar) import
        // stylesheet assets. There is no runtime styling requirement for the
        // fixture, so treat any stylesheet import as an inert source string
        // rather than pulling in css-loader/style-loader.
        {
          test: /\.(css|scss|sass|less)$/,
          type: 'asset/source',
        },
      ],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: 'plugin.json', to: '.' },
          { from: 'img/**/*', to: '.', noErrorOnMissing: true },
          { from: '../README.md', to: '.', noErrorOnMissing: true },
        ],
      }),
    ],
  };
};
