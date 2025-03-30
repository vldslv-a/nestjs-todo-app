import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import type { INestApplication } from '@nestjs/common';

type ServerConfig = {
  host: string;
  port: string;
  path: string;
  protocol: string;
};

export function setupSwagger(app: INestApplication, serverConfig: ServerConfig) {
  const config = new DocumentBuilder()
    .setTitle('NestJS Todo API')
    .setDescription('Todo application API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        bearerFormat: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
        name: 'Authorization',
        scheme: 'bearer',
        type: 'http',
      },
      'JWT-auth',
    )
    .addCookieAuth('refresh_token', {
      in: 'cookie',
      name: 'refresh_token',
      type: 'apiKey',
    })
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup(`${serverConfig.path}/docs`, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  SwaggerModule.setup(`${serverConfig.path}/swagger`, app, document, {
    explorer: false,
    jsonDocumentUrl: `${serverConfig.path}/swagger.json`,
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  return {
    swaggerJsonUrl: `${serverConfig.protocol}://${serverConfig.host}:${serverConfig.port}/${serverConfig.path}/swagger.json`,
    swaggerUrl: `${serverConfig.protocol}://${serverConfig.host}:${serverConfig.port}/${serverConfig.path}/docs`,
  };
}
