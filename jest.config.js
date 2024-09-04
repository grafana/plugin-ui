const path = require('path');

/*
 * This utility function is useful in combination with jest `transformIgnorePatterns` config
 * to transform specific packages (e.g.ES modules) in a projects node_modules folder.
 */
const nodeModulesToTransform = (moduleNames) => `node_modules\/(?!(${moduleNames.join('|')})\/)`;

const grafanaESModules = [
  'd3',
  'd3-color',
  'd3-force',
  'd3-interpolate',
  'd3-scale-chromatic',
  'ol',
  'react-colorful',
  'uuid',
];

module.exports = {
  verbose: false,
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  roots: ['<rootDir>/src'],
  testRegex: '(\\.|/)(test)\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  globals: { 'ts-jest': { isolatedModules: true } },
  moduleNameMapper: {
    '^react($|/.+)': '<rootDir>/node_modules/react$1',
    '\\.css': '<rootDir>/src/test/mocks/style.ts',
    'react-inlinesvg': path.resolve(__dirname, 'jest', 'react-inlinesvg.tsx'),
  },
  testEnvironment: 'jest-environment-jsdom',
  // Jest will throw `Cannot use import statement outside module` if it tries to load an
  // ES module without it being transformed first. ./config/README.md#esm-errors-with-jest
  transformIgnorePatterns: [nodeModulesToTransform(grafanaESModules)],
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
};
