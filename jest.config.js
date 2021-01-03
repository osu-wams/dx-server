module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/config/', '/src/types/', '/src/mocks', '/dist/'],
  modulePathIgnorePatterns: ['/dist/'],
  globalSetup: '<rootDir>/src/utils/jestGlobal.ts',
  setupFilesAfterEnv: ['<rootDir>/src/utils/jestSetup.ts'],
  clearMocks: true,
  coverageDirectory: './coverage/',
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/setupTests.ts',
    '!src/types/**/*',
    '!src/mocks/**/*',
    '!src/db/scripts/**/*',
  ],
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  coverageThreshold: {
    global: {
      branches: 30,
      functions: 30,
      lines: 30,
      statements: 10,
    },
  },
};
