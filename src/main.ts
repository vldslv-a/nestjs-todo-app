import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';
import { setupApp } from './config/app.config';
import { setupSwagger } from './config/swagger.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  setupApp(app);

  const configService = app.get(ConfigService);
  const protocol = configService.getOrThrow<string>('APP_PROTOCOL');
  const host = configService.getOrThrow<string>('APP_HOST');
  const port = configService.getOrThrow<string>('APP_PORT');
  const globalPrefix = configService.getOrThrow<string>('APP_GLOBAL_PREFIX');

  app.setGlobalPrefix(globalPrefix);

  const { swaggerJsonUrl, swaggerUrl } = setupSwagger(app, {
    host,
    path: globalPrefix,
    port,
    protocol,
  });

  await app.listen(port, () => {
    console.log(`Server is running on ${protocol}://${host}:${port}/${globalPrefix}`);
    console.log(`Swagger documentation is available at ${swaggerUrl}`);
    console.log(`Swagger JSON for Postman is available at ${swaggerJsonUrl}`);
  });
}

bootstrap().catch(console.error);
