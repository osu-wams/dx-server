module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/config/', '/src/types/', '/dist/'],
  modulePathIgnorePatterns: ['/dist/'],
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.{js,ts}',
    '!**/coverage/**',
    '!src/setupTests.ts',
    '!jest.config.js',
    '!config/**',
    '!dist/**',
    '!src/types/**'
  ],
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 10
    }
  }
};
