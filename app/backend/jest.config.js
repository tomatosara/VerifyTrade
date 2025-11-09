/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  verbose: false,
  detectOpenHandles: false,
  forceExit: false,
  roots: ['<rootDir>/src'],
  modulePaths: ['<rootDir>/src'],
  moduleNameMapper: {
    '^@config/(.*)$': '<rootDir>/src/config/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@middleware/(.*)$': '<rootDir>/src/middleware/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1'
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  reporters: ['default'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/http/routes.ts',
    '!src/**/*.d.ts',
    '!src/**/index.ts',
    '!src/test/**'
  ],
  coverageDirectory: '<rootDir>/coverage',
  testTimeout: 60000
};

module.exports = config;
