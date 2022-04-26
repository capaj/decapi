export default {
  preset: 'ts-jest',
  modulePaths: ['<rootDir>/src/'],
  moduleFileExtensions: ['ts', 'tsx', 'js'],
  collectCoverage: false,
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],
  resolver: 'jest-ts-webcompat-resolver',
  testMatch: ['**/*.spec.(ts|tsx|js)'],
  setupFiles: ['<rootDir>/src/specs/setup.ts'],
  globals: {
    'ts-jest': {
      diagnostics: false,
      compiler: 'ttypescript'
    }
  }
}
