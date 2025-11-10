// import type { Config } from 'jest';

// const config: Config = {
//   moduleFileExtensions: ['js', 'json', 'ts'],
//   rootDir: '.',
//   testRegex: '.*\\.(e2e|spec)\\.ts$',
//   transform: {
//     '^.+\\.(t|j)s$': 'ts-jest',
//   },
//   setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
//   testEnvironment: 'node',
//   verbose: true,
//   detectOpenHandles: true,
//   maxWorkers: 1,
// };

// export default config;
import type { Config } from 'jest';

const config: Config = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testMatch: ['<rootDir>/test/**/*.e2e-spec.ts', '<rootDir>/test/**/*.spec.ts'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],
  testEnvironment: 'node',
  verbose: true,
  detectOpenHandles: true,
  maxWorkers: 1,

  moduleNameMapper: {
    '@shared/(.*)': '<rootDir>/../../shared/$1',
    '^src/(.*)$': '<rootDir>/src/$1',
  },
};

export default config;
