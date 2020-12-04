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
  globals: { 'ts-jest': { isolatedModules: true } },
  moduleNameMapper: {
    '^react($|/.+)': '<rootDir>/node_modules/react$1',
  },
  watchPathIgnorePatterns: ['<rootDir>/node_modules/'],
};
