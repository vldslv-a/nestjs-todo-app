import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { JwtService } from 'src/token/services/jwt.service';

import { JwtStrategy } from './jwt.strategy';

import type { TestingModule } from '@nestjs/testing';
import type { JwtPayloadDto } from 'src/token/dto/jwt-payload.dto';
import type { JwtUserPayload } from 'src/token/models/jwt-user-payload.model';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockConfigService = {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  };

  const mockJwtService = {
    validatePayload: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should be defined', () => {
      expect(strategy).toBeDefined();
    });

    it('should set up the strategy with correct options', () => {
      expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_SECRET');
    });
  });

  describe('validate', () => {
    it('should call jwtService.validatePayload with the payload', async () => {
      const payload: JwtPayloadDto = {
        email: 'test@mail.com',
        exp: 1234567890,
        iat: 1234567890,
        sub: 123,
      };
      const expectedResult: JwtUserPayload = {
        email: 'test@mail.com',
        userId: 123,
      };
      mockJwtService.validatePayload.mockResolvedValue(expectedResult);

      const result = await strategy.validate(payload);

      expect(jwtService.validatePayload).toHaveBeenCalledWith(payload);
      expect(result).toEqual(expectedResult);
    });

    it('should return the validated payload from jwtService', async () => {
      const payload: JwtPayloadDto = {
        email: 'anotheremail@mail.com',
        exp: 1234567890,
        iat: 1234567890,
        sub: 456,
      };
      const expectedResult: JwtUserPayload = {
        email: 'anotheremail@mail.com',
        userId: 456,
      };
      mockJwtService.validatePayload.mockResolvedValue(expectedResult);

      const result = await strategy.validate(payload);

      expect(result).toEqual(expectedResult);
    });

    it('should propagate errors from jwtService.validatePayload', async () => {
      const payload: JwtPayloadDto = {
        email: 'erroremail@mail.com',
        exp: 1234567890,
        iat: 1234567890,
        sub: 789,
      };
      const error = new Error('Validation error');
      mockJwtService.validatePayload.mockRejectedValue(error);

      await expect(strategy.validate(payload)).rejects.toThrow(error);
      expect(jwtService.validatePayload).toHaveBeenCalledWith(payload);
    });
  });
});
