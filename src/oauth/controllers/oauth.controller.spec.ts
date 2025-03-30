import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { CookieService } from 'src/cookie/services/cookie.service';

import { OAuthService } from '../services/oauth.service';

import { OAuthController } from './oauth.controller';

import type { OAuthUser } from '../models/oauth-user.model';
import type { TestingModule } from '@nestjs/testing';
import type { Response } from 'express';

const MOCK_EMAIL = 'test@example.com';

describe('OAuthController', () => {
  let oauthController: OAuthController;

  const mockOAuthService = {
    handleOAuthLogin: jest.fn(),
  };

  const mockConfigService = {
    getOrThrow: jest.fn((key: string) => `mock-${key}`),
  };

  const mockCookieService = {
    setRefreshTokenCookie: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: CookieService, useValue: mockCookieService },
      ],
    }).compile();

    oauthController = module.get<OAuthController>(OAuthController);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(oauthController).toBeDefined();
  });

  it('should handle Google OAuth callback and redirect', async () => {
    const mockReq = {
      user: {
        email: MOCK_EMAIL,
        firstName: 'John',
        lastName: 'Doe',
        profileId: '123',
        provider: 'google',
      } as OAuthUser,
    };
    const mockRes = { redirect: jest.fn() } as unknown as Response;

    mockOAuthService.handleOAuthLogin.mockResolvedValue({ accessToken: 'token', refreshToken: 'refresh' });

    await oauthController.googleAuthCallback(mockReq, mockRes);

    expect(mockCookieService.setRefreshTokenCookie).toHaveBeenCalledWith(mockRes, 'refresh');
    expect(mockRes.redirect).toHaveBeenCalledWith('mock-FRONTEND_URL?token=token');
  });

  it('should handle Google OAuth callback without refresh token', async () => {
    const mockReq = {
      user: {
        email: MOCK_EMAIL,
        firstName: 'John',
        lastName: 'Doe',
        profileId: '123',
        provider: 'google',
      } as OAuthUser,
    };
    const mockRes = { redirect: jest.fn() } as unknown as Response;

    mockOAuthService.handleOAuthLogin.mockResolvedValue({ accessToken: 'token' });

    await oauthController.googleAuthCallback(mockReq, mockRes);

    expect(mockCookieService.setRefreshTokenCookie).not.toHaveBeenCalled();
    expect(mockRes.redirect).toHaveBeenCalledWith('mock-FRONTEND_URL?token=token');
  });
});
