import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { UsersService } from 'src/users/services/users.service';

import { JwtService } from './jwt.service';

import type { TokenUserDto } from '../dto/token-user.dto';
import type { TestingModule } from '@nestjs/testing';
import type { User } from '@prisma/client';

const JWT_EXPIRES_IN = 'JWT_EXPIRES_IN';
const JWT_SECRET = 'JWT_SECRET';
const JWT_REFRESH_EXPIRES_IN = 'JWT_REFRESH_EXPIRES_IN';
const JWT_REFRESH_SECRET = 'JWT_REFRESH_SECRET';
const REFRESH_SECRET_VALUE = 'refresh-secret';
const TEST_SECRET_VALUE = 'test-secret';
const ACCESS_TOKEN = 'access-token';
const REFRESH_TOKEN = 'refresh-token';
const NEW_ACCESS_TOKEN = 'new-access-token';
const NEW_REFRESH_TOKEN = 'new-refresh-token';
const TEST_HASHED_PASSWORD = 'some-secure-hash';

describe('JwtService', () => {
  let jwtService: JwtService;
  let nestJwtService: NestJwtService;
  let usersService: UsersService;

  const mockUser: User = {
    createdAt: new Date(),
    email: 'test@example.com',
    firstName: 'Test',
    id: 1,
    isEmailVerified: false,
    lastName: 'User',
    logo: null,
    password: TEST_HASHED_PASSWORD,
    updatedAt: new Date(),
  };

  const mockTokenUser: TokenUserDto = {
    email: 'test@example.com',
    id: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtService,
        {
          provide: NestJwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue('token'),
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: jest.fn().mockImplementation((key: string) => {
              const config = {
                [JWT_EXPIRES_IN]: '1h',
                [JWT_REFRESH_EXPIRES_IN]: '7d',
                [JWT_REFRESH_SECRET]: REFRESH_SECRET_VALUE,
                [JWT_SECRET]: TEST_SECRET_VALUE,
              };
              return config[key];
            }),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    jwtService = module.get<JwtService>(JwtService);
    nestJwtService = module.get<NestJwtService>(NestJwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(jwtService).toBeDefined();
  });

  describe('generateTokens', () => {
    it('should return accessToken only when includeRefreshToken is false', async () => {
      jest
        .spyOn(
          jwtService as unknown as { generateAccessToken: (user: TokenUserDto) => Promise<string> },
          'generateAccessToken',
        )
        .mockResolvedValue(ACCESS_TOKEN);

      const result = await jwtService.generateAuthTokens(mockTokenUser);
      expect(result).toEqual({ accessToken: ACCESS_TOKEN });
    });

    it('should return both accessToken and refreshToken when includeRefreshToken is true', async () => {
      jest
        .spyOn(
          jwtService as unknown as { generateAccessToken: (user: TokenUserDto) => Promise<string> },
          'generateAccessToken',
        )
        .mockResolvedValue(ACCESS_TOKEN);
      jest
        .spyOn(
          jwtService as unknown as { generateRefreshToken: (userId: number) => Promise<string> },
          'generateRefreshToken',
        )
        .mockResolvedValue(REFRESH_TOKEN);

      const result = await jwtService.generateAuthTokens(mockTokenUser, true);
      expect(result).toEqual({ accessToken: ACCESS_TOKEN, refreshToken: REFRESH_TOKEN });
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      jest.spyOn(nestJwtService, 'verifyAsync').mockResolvedValue({ sub: 1 });
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      jest.spyOn(jwtService, 'generateAuthTokens').mockResolvedValue({
        accessToken: NEW_ACCESS_TOKEN,
        refreshToken: NEW_REFRESH_TOKEN,
      });

      const result = await jwtService.refreshToken('valid-refresh-token');
      expect(result).toEqual({ accessToken: NEW_ACCESS_TOKEN, refreshToken: NEW_REFRESH_TOKEN });
    });

    it('should throw UnauthorizedException when refresh token is invalid', async () => {
      jest.spyOn(nestJwtService, 'verifyAsync').mockRejectedValue(new Error());

      await expect(jwtService.refreshToken('invalid-refresh-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('validatePayload', () => {
    it('should return user payload when valid', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);
      const result = await jwtService.validatePayload({ email: mockUser.email, sub: 1 });
      expect(result).toEqual({ email: mockUser.email, userId: mockUser.id });
    });
  });

  describe('findUserById', () => {
    it('should return user when user exists', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser);

      const result = await jwtService['findUserById'](mockUser.id, 'Error message');
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);

      await expect(jwtService['findUserById'](mockUser.id, 'Error message')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('generateAccessToken', () => {
    it('should generate an access token', async () => {
      jest.spyOn(nestJwtService, 'signAsync').mockResolvedValue(ACCESS_TOKEN);

      const result = await jwtService['generateAccessToken'](mockTokenUser);
      expect(result).toBe(ACCESS_TOKEN);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a refresh token', async () => {
      jest.spyOn(nestJwtService, 'signAsync').mockResolvedValue(REFRESH_TOKEN);

      const result = await jwtService['generateRefreshToken'](mockUser.id);
      expect(result).toBe(REFRESH_TOKEN);
    });
  });

  describe('signToken', () => {
    it('should sign a token with the correct payload and options', async () => {
      const payload = { email: mockUser.email, sub: mockUser.id };
      jest.spyOn(nestJwtService, 'signAsync').mockResolvedValue(ACCESS_TOKEN);

      const result = await jwtService['signToken'](payload, JWT_EXPIRES_IN, JWT_SECRET);
      expect(result).toBe(ACCESS_TOKEN);
      expect(nestJwtService.signAsync).toHaveBeenCalledWith(payload, {
        expiresIn: '1h',
        secret: TEST_SECRET_VALUE,
      });
    });
  });
});
