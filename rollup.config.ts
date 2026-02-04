import resolve from '@rollup/plugin-node-resolve';
import { createRequire } from 'node:module';
import path from 'path';
import dts from 'rollup-plugin-dts';
import commonjs from '@rollup/plugin-commonjs';
import esbuild from 'rollup-plugin-esbuild';
import { nodeExternals } from 'rollup-plugin-node-externals';

if (!process.env.PROJECT_CWD) {
  throw new Error('PROJECT_CWD is not defined');
}

const rq = createRequire(import.meta.url);
const pkg = rq('./package.json');

const legacyOutputDefaults = {
  esModule: true,
  interop: 'compat',
};

const entryPoints = ['src/index.ts', 'src/test.ts'];

export default [
  {
    input: entryPoints,
    plugins: [
      nodeExternals({ deps: true, peerDeps: true, packagePath: './package.json' }),
      commonjs(),
      resolve(),
      esbuild({
        target: 'es2018',
        tsconfig: 'tsconfig.build.json',
      }),
    ],
    output: [
      {
        format: 'cjs',
        sourcemap: true,
        dir: path.dirname(pkg.main),
        entryFileNames: `[name]${path.extname(pkg.main)}`,
        ...legacyOutputDefaults,
      },
      {
        format: 'esm',
        sourcemap: true,
        dir: path.dirname(pkg.module),
        preserveModules: true,
        preserveModulesRoot: path.join(process.env.PROJECT_CWD, 'src'),
        ...legacyOutputDefaults,
      },
    ],
  },
  {
    input: './compiled/index.d.ts',
    plugins: [dts()],
    output: [
      {
        file: pkg.exports['.'].require.types,
        format: 'cjs',
      },
      {
        file: pkg.exports['.'].import.types,
        format: 'esm',
      },
    ],
  },
  {
    input: './compiled/test.d.ts',
    plugins: [dts()],
    output: [
      {
        file: pkg.exports['./test'].require.types,
        format: 'cjs',
      },
      {
        file: pkg.exports['./test'].import.types,
        format: 'esm',
      },
    ],
  },
];
