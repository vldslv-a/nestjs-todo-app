import { BadRequestException, ValidationPipe } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';

import { setupApp } from './app.config';

import type { INestApplication } from '@nestjs/common';

jest.mock('cookie-parser', () => jest.fn());

type MockNestApplication = {
  use: jest.Mock;
  useGlobalPipes: jest.Mock;
};

describe('App Config', () => {
  let app: MockNestApplication;

  beforeEach(() => {
    app = {
      use: jest.fn(),
      useGlobalPipes: jest.fn(),
    };
    jest.clearAllMocks();
  });

  describe('setupApp', () => {
    it('should set up cookie parser', () => {
      setupApp(app as unknown as INestApplication);

      expect(app.use).toHaveBeenCalledTimes(1);
      expect(app.use).toHaveBeenCalledWith(cookieParser());
    });

    it('should set up global validation pipe with correct options', () => {
      setupApp(app as unknown as INestApplication);

      expect(app.useGlobalPipes).toHaveBeenCalledTimes(1);

      const validationPipe = app.useGlobalPipes.mock.calls[0][0];
      expect(validationPipe).toBeInstanceOf(ValidationPipe);

      const mockErrors = [{ field: 'test', message: 'error' }];
      const exception = validationPipe['exceptionFactory'](mockErrors);
      expect(exception).toBeInstanceOf(BadRequestException);
      expect(exception.getResponse()).toEqual({
        error: 'Bad Request',
        message: mockErrors,
        statusCode: 400,
      });

      const constructorCall = app.useGlobalPipes.mock.calls[0][0];
      expect(constructorCall).toBeInstanceOf(ValidationPipe);
    });
  });
});
