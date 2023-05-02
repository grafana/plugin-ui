module.exports = {
  verbose: false,
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'ts-jest',
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  roots: ['<rootDir>/src'],
  testRegex: '(\\.|/)(test)\\.(jsx?|tsx?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  setupFiles: ['jest-canvas-mock'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setupTests.ts'],
  globals: { 'ts-jest': { isolatedModules: true } },
  moduleNameMapper: {
    '^react($|/.+)': '<rootDir>/node_modules/react$1',
    '\\.css': '<rootDir>/src/test/mocks/style.ts',
    'react-inlinesvg': '<rootDir>/src/test/mocks/react-inlinesvg.tsx',
  },
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
};
