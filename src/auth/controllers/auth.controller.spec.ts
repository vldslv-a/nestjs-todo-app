import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { CookieService } from 'src/cookie/services/cookie.service';
import { VerificationService } from 'src/verification/services/verification.service';

import { AuthService } from '../services/auth.service';

import { AuthController } from './auth.controller';

import type { LoginDto } from '../dto/login.dto';
import type { RegistrationDto } from '../dto/registration.dto';
import type { TestingModule } from '@nestjs/testing';
import type { Request, Response } from 'express';
import type { RequestVerificationDto } from 'src/verification/dto/request-verification.dto';
import type { ResetPasswordWithTokenDto } from 'src/verification/dto/reset-password-with-token.dto';
import type { VerifyEmailDto } from 'src/verification/dto/verify-email.dto';

type MockRequest = Partial<Request>;
type MockResponse = Partial<Response>;

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;
  let cookieService: CookieService;
  let verificationService: VerificationService;

  const EMAIL = 'test@example.com';
  const PASSWORD = 'securePassword!123';
  const NEW_PASSWORD = 'new-securePassword!123';
  const ACCESS_TOKEN = 'access-token';

  const mockAuthService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    registration: jest.fn(),
  };

  const mockCookieService = {
    clearRefreshTokenCookie: jest.fn(),
    setRefreshTokenCookie: jest.fn(),
  };

  const mockVerificationService = {
    requestPasswordReset: jest.fn(),
    resetPasswordWithToken: jest.fn(),
    sendVerificationEmail: jest.fn(),
    verifyEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: CookieService, useValue: mockCookieService },
        { provide: VerificationService, useValue: mockVerificationService },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    cookieService = module.get<CookieService>(CookieService);
    verificationService = module.get<VerificationService>(VerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = { email: EMAIL, password: PASSWORD };
    const mockResponse: MockResponse = { cookie: jest.fn() };

    const loginResult = { accessToken: ACCESS_TOKEN, refreshToken: 'refresh-token' };

    it('should login successfully and set refresh token cookie', async () => {
      mockAuthService.login.mockResolvedValue(loginResult);

      const result = await controller.login(mockResponse as Response, loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(cookieService.setRefreshTokenCookie).toHaveBeenCalledWith(mockResponse, 'refresh-token');
      expect(result).toEqual({ accessToken: ACCESS_TOKEN });
    });

    it('should login successfully without setting cookie when no refresh token', async () => {
      const noRefreshResult = { accessToken: ACCESS_TOKEN };
      mockAuthService.login.mockResolvedValue(noRefreshResult);

      const result = await controller.login(mockResponse as Response, loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(cookieService.setRefreshTokenCookie).not.toHaveBeenCalled();
      expect(result).toEqual({ accessToken: ACCESS_TOKEN });
    });
  });

  describe('logout', () => {
    const mockResponse: MockResponse = { clearCookie: jest.fn() };

    it('should clear refresh token cookie', async () => {
      const result = await controller.logout(mockResponse as Response);

      expect(cookieService.clearRefreshTokenCookie).toHaveBeenCalledWith(mockResponse);
      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    const refreshResult = { accessToken: 'new-access-token' };

    it('should refresh token successfully', async () => {
      mockAuthService.refreshToken.mockResolvedValue(refreshResult);
      const mockRequest: MockRequest = {
        cookies: {
          refresh_token: 'valid-refresh-token',
        },
      };

      const result = await controller.refreshToken(mockRequest as Request);

      expect(authService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(result).toEqual(refreshResult);
    });

    it('should throw UnauthorizedException when refresh token is missing', async () => {
      const mockRequest: MockRequest = { cookies: {} };

      await expect(controller.refreshToken(mockRequest as Request)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.REFRESH_TOKEN_REQUIRED),
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when refresh token is not a string', async () => {
      const mockRequest: MockRequest = {
        cookies: {
          refresh_token: null as unknown as string,
        },
      };

      await expect(controller.refreshToken(mockRequest as Request)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.REFRESH_TOKEN_REQUIRED),
      );
      expect(authService.refreshToken).not.toHaveBeenCalled();
    });
  });

  describe('registration', () => {
    const registrationDto: RegistrationDto = {
      email: 'new@example.com',
      firstName: 'John',
      lastName: 'Doe',
      password: NEW_PASSWORD,
    };
    const registrationResult = { email: 'new@example.com', id: '1' };

    it('should register a new user successfully', async () => {
      mockAuthService.registration.mockResolvedValue(registrationResult);

      const result = await controller.registration(registrationDto);

      expect(authService.registration).toHaveBeenCalledWith(registrationDto);
      expect(result).toEqual(registrationResult);
    });
  });

  describe('requestEmailVerification', () => {
    const verificationDto: RequestVerificationDto = { email: EMAIL };

    it('should request email verification successfully', async () => {
      mockVerificationService.sendVerificationEmail.mockResolvedValue(undefined);

      await controller.requestEmailVerification(verificationDto);

      expect(verificationService.sendVerificationEmail).toHaveBeenCalledWith(verificationDto);
    });
  });

  describe('requestPasswordReset', () => {
    const resetRequestDto: RequestVerificationDto = { email: EMAIL };

    it('should request password reset successfully', async () => {
      mockVerificationService.requestPasswordReset.mockResolvedValue(undefined);

      await controller.requestPasswordReset(resetRequestDto);

      expect(verificationService.requestPasswordReset).toHaveBeenCalledWith(resetRequestDto);
    });
  });

  describe('resetPasswordUsingToken', () => {
    const resetPasswordDto: ResetPasswordWithTokenDto = {
      password: NEW_PASSWORD,
      token: 'reset-token',
    };

    it('should reset password with token successfully', async () => {
      mockVerificationService.resetPasswordWithToken.mockResolvedValue(undefined);

      await controller.resetPasswordUsingToken(resetPasswordDto);

      expect(verificationService.resetPasswordWithToken).toHaveBeenCalledWith(resetPasswordDto);
    });
  });

  describe('verifyEmail', () => {
    const verifyEmailDto: VerifyEmailDto = { token: 'verification-token' };

    it('should verify email successfully', async () => {
      mockVerificationService.verifyEmail.mockResolvedValue(undefined);

      await controller.verifyEmail(verifyEmailDto);

      expect(verificationService.verifyEmail).toHaveBeenCalledWith(verifyEmailDto);
    });
  });
});
