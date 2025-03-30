import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
  collectCoverageFrom: ['src/**/*.ts'],
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    'src/console',
    'src/migration',
    'src/.*\\.dto\\.ts$',
    'src/.*\\.responses\\.ts$',
    'src/.*\\.model\\.ts$',
    'src/.*\\.module\\.ts$',
    'src/main.ts',
  ],
  moduleFileExtensions: ['js', 'json', 'ts'],
  modulePaths: ['.'],
  reporters: [
    'default',
    [
      'jest-junit',
      {
        ancestorSeparator: ' › ',
        outputDirectory: 'reports',
        outputName: 'unit-test.xml',
        suiteNameTemplate: '{filename}',
        uniqueOutputName: 'false',
      },
    ],
  ],
  testEnvironment: 'node',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  verbose: true,
};

export default config;
