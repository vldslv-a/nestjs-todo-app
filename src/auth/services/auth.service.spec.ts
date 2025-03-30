import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare, hash } from 'bcrypt';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { JwtService } from 'src/token/services/jwt.service';
import { UsersService } from 'src/users/services/users.service';
import { VerificationService } from 'src/verification/services/verification.service';

import { AuthService } from './auth.service';

import type { TestingModule } from '@nestjs/testing';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;

  const PASSWORD = 'Password123!';
  const HASHED_PASSWORD = 'hashedPassword';
  const EXISTING_HASHED_PASSWORD = 'existingHashedPassword';

  const mockUsersService = {
    create: jest.fn(),
    findByEmail: jest.fn(),
  };

  const mockJwtService = {
    generateAuthTokens: jest.fn(),
    refreshToken: jest.fn(),
  };

  const mockVerificationService = {
    sendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: VerificationService, useValue: mockVerificationService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: PASSWORD,
      rememberMe: false,
    };

    const user = {
      email: 'test@example.com',
      firstName: 'Test',
      id: 1,
      lastName: 'User',
      password: HASHED_PASSWORD,
    };

    const tokenResponse = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    it('should return tokens when credentials are valid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.generateAuthTokens.mockResolvedValue(tokenResponse);

      const result = await service.login(loginDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(mockJwtService.generateAuthTokens).toHaveBeenCalledWith(
        { email: user.email, id: user.id },
        loginDto.rememberMe,
      );
      expect(result).toEqual(tokenResponse);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS),
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(compare).not.toHaveBeenCalled();
      expect(mockJwtService.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.INVALID_CREDENTIALS),
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(compare).toHaveBeenCalledWith(loginDto.password, user.password);
      expect(mockJwtService.generateAuthTokens).not.toHaveBeenCalled();
    });

    it('should use rememberMe flag when provided', async () => {
      const loginDtoWithRememberMe = { ...loginDto, rememberMe: true };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.generateAuthTokens.mockResolvedValue(tokenResponse);

      await service.login(loginDtoWithRememberMe);

      expect(mockJwtService.generateAuthTokens).toHaveBeenCalledWith({ email: user.email, id: user.id }, true);
    });

    it('should use default rememberMe value when undefined', async () => {
      const loginDtoWithoutRememberMe = {
        email: loginDto.email,
        password: loginDto.password,
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.generateAuthTokens.mockResolvedValue(tokenResponse);

      await service.login(loginDtoWithoutRememberMe);

      expect(mockJwtService.generateAuthTokens).toHaveBeenCalledWith({ email: user.email, id: user.id }, false);
    });
  });

  describe('refreshToken', () => {
    const refreshToken = 'refresh-token';
    const tokenResponse = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    };

    it('should return new tokens when refresh token is valid', async () => {
      mockJwtService.refreshToken.mockResolvedValue(tokenResponse);

      const result = await service.refreshToken(refreshToken);

      expect(mockJwtService.refreshToken).toHaveBeenCalledWith(refreshToken);
      expect(result).toEqual(tokenResponse);
    });

    it('should propagate errors from JwtService', async () => {
      const error = new Error('Invalid token');
      mockJwtService.refreshToken.mockRejectedValue(error);

      await expect(service.refreshToken(refreshToken)).rejects.toThrow(error);

      expect(mockJwtService.refreshToken).toHaveBeenCalledWith(refreshToken);
    });
  });

  describe('registration', () => {
    const registrationDto = {
      email: 'new@example.com',
      firstName: 'New',
      lastName: 'User',
      password: PASSWORD,
    };

    const hashedPassword = 'hashed-password';

    it('should create user and send verification email when registration is successful', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);
      mockUsersService.create.mockResolvedValue({ id: 2, ...registrationDto, password: hashedPassword });
      mockVerificationService.sendVerificationEmail.mockResolvedValue(undefined);

      const result = await service.registration(registrationDto);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registrationDto.email);
      expect(hash).toHaveBeenCalledWith(registrationDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalledWith({
        ...registrationDto,
        password: hashedPassword,
      });
      expect(mockVerificationService.sendVerificationEmail).toHaveBeenCalledWith({
        email: registrationDto.email,
      });
      expect(result).toBeNull();
    });

    it('should throw UnauthorizedException when user with email already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({
        email: registrationDto.email,
        id: 3,
        password: EXISTING_HASHED_PASSWORD,
      });

      await expect(service.registration(registrationDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.USER_ALREADY_EXISTS),
      );

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registrationDto.email);
      expect(hash).not.toHaveBeenCalled();
      expect(mockUsersService.create).not.toHaveBeenCalled();
      expect(mockVerificationService.sendVerificationEmail).not.toHaveBeenCalled();
    });

    it('should propagate errors from dependencies', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      (hash as jest.Mock).mockResolvedValue(hashedPassword);
      const error = new Error('Database error');
      mockUsersService.create.mockRejectedValue(error);

      await expect(service.registration(registrationDto)).rejects.toThrow(error);

      expect(mockUsersService.findByEmail).toHaveBeenCalledWith(registrationDto.email);
      expect(hash).toHaveBeenCalledWith(registrationDto.password, 10);
      expect(mockUsersService.create).toHaveBeenCalled();
      expect(mockVerificationService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
