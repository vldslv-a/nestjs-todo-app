import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { CookieService } from './cookie.service';

import type { TestingModule } from '@nestjs/testing';
import type { Response } from 'express';

describe('CookieService', () => {
  let service: CookieService;
  let configService: ConfigService;

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => {
      const config = {
        JWT_REFRESH_COOKIE_HTTP_ONLY: true,
        JWT_REFRESH_COOKIE_MAX_AGE_DAYS: 7,
        JWT_REFRESH_COOKIE_NAME: 'refresh_token',
        JWT_REFRESH_COOKIE_PATH: '/',
        JWT_REFRESH_COOKIE_SAME_SITE: 'lax',
        JWT_REFRESH_COOKIE_SECURE: true,
      };
      return config[key];
    }),
  };

  const mockResponse = {
    clearCookie: jest.fn(),
    cookie: jest.fn(),
  } as unknown as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CookieService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<CookieService>(CookieService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('clearRefreshTokenCookie', () => {
    it('should clear refresh token cookie', () => {
      service.clearRefreshTokenCookie(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledWith('refresh_token', {
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
      });
    });
  });

  describe('setRefreshTokenCookie', () => {
    it('should set refresh token cookie with correct options', () => {
      const refreshToken = 'test-refresh-token';

      service.setRefreshTokenCookie(mockResponse, refreshToken);

      expect(mockResponse.cookie).toHaveBeenCalledWith('refresh_token', refreshToken, {
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
        sameSite: 'lax',
        secure: true,
      });
    });
  });

  describe('getBaseCookieOptions (private method test)', () => {
    it('should return base cookie options', () => {
      // @ts-expect-error - accessing private method for testing
      const options = service.getBaseCookieOptions();

      expect(options).toEqual({
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
      });
    });

    it('should merge provided options with base options', () => {
      // @ts-expect-error - accessing private method for testing
      const options = service.getBaseCookieOptions({ domain: 'example.com' });

      expect(options).toEqual({
        domain: 'example.com',
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: true,
      });
    });
  });

  describe('getRefreshCookieMaxAge (private method test)', () => {
    it('should convert days to milliseconds', () => {
      // @ts-expect-error - accessing private method for testing
      const maxAge = service.getRefreshCookieMaxAge();

      expect(maxAge).toBe(7 * 24 * 60 * 60 * 1000);
    });

    it('should use the config value', () => {
      jest.spyOn(configService, 'getOrThrow').mockReturnValueOnce(30);

      // @ts-expect-error - accessing private method for testing
      const maxAge = service.getRefreshCookieMaxAge();

      expect(maxAge).toBe(30 * 24 * 60 * 60 * 1000);
      expect(configService.getOrThrow).toHaveBeenCalledWith('JWT_REFRESH_COOKIE_MAX_AGE_DAYS');
    });
  });
});
