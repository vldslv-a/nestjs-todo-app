import type { KnipConfig } from 'knip';

const config: KnipConfig = {
  entry: ['src/main.ts'],
  ignore: ['test/*', 'prisma/gen/**'],
  ignoreBinaries: [],
  ignoreDependencies: [
    '@nestjs/testing',
    '@types/supertest',
    'install',
    'npm',
    'source-map-support',
    'supertest',
    'ts-loader',
    '@jest/types',
    'globals',
  ],
  jest: true,
  nest: true,
  project: ['src/**/*.ts'],
  rules: {
    binaries: 'error',
    classMembers: 'error',
    dependencies: 'error',
    devDependencies: 'error',
    duplicates: 'error',
    enumMembers: 'error',
    exports: 'error',
    files: 'error',
    nsExports: 'error',
    nsTypes: 'error',
    optionalPeerDependencies: 'error',
    types: 'error',
    unlisted: 'error',
    unresolved: 'warn',
  },
};

export default config;
