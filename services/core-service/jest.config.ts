import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testEnvironment: 'node',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testMatch: [
    '<rootDir>/src/**/tests/**/*.spec.ts', //  Unit tests
    '<rootDir>/src/**/tests/**/*.e2e.spec.ts', //  E2E tests
  ],
  verbose: true,
  coverageDirectory: './coverage',
};

export default config;
