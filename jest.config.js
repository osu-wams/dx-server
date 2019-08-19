module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/config/', '/src/types/', '/dist/'],
  modulePathIgnorePatterns: ['/dist/'],
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/setupTests.ts',
    '!src/types/**/*',
    '!src/db/scripts/**/*'
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
