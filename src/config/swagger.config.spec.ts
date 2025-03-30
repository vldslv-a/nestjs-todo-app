import { Test } from '@nestjs/testing';

import { setupSwagger } from './swagger.config';

import type { INestApplication } from '@nestjs/common';

describe('setupSwagger', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({}).compile();

    app = moduleRef.createNestApplication();

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should set up Swagger documentation correctly', () => {
    const serverConfig = {
      host: 'localhost',
      path: 'api',
      port: '3000',
      protocol: 'http',
    };

    const result = setupSwagger(app, serverConfig);

    expect(result).toEqual({
      swaggerJsonUrl: `${serverConfig.protocol}://${serverConfig.host}:${serverConfig.port}/${serverConfig.path}/swagger.json`,
      swaggerUrl: `${serverConfig.protocol}://${serverConfig.host}:${serverConfig.port}/${serverConfig.path}/docs`,
    });
  });
});
