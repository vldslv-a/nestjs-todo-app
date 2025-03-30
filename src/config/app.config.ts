import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

import type { INestApplication } from '@nestjs/common';

export function setupApp(app: INestApplication): void {
  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: (errors) => new BadRequestException(errors),
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
}
