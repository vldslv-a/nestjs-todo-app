import { BadRequestException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { VerificationTokenType } from '@prisma/client';
import { hash } from 'bcrypt';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { MailService } from 'src/mail/services/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/services/users.service';

import { VerificationService } from './verification.service';

import type { TestingModule } from '@nestjs/testing';

jest.mock('bcrypt');

jest.mock('crypto', () => ({
  randomBytes: jest.fn().mockReturnValue({
    toString: jest.fn().mockReturnValue('mocked-token'),
  }),
}));

describe('VerificationService', () => {
  const TEST_PASSWORD = 'test_password_value';
  const NEW_PASSWORD = 'new-password-for-testing';
  const TEST_EMAIL = 'test@example.com';
  const NONEXISTENT_EMAIL = 'nonexistent@example.com';
  const HASHED_PASSWORD = 'hashed-password';
  const MOCK_TOKEN = 'mocked-token';
  const INVALID_TOKEN = 'invalid-token';

  let service: VerificationService;
  let prismaService: PrismaService;
  let usersService: UsersService;
  let mailService: MailService;

  const mockUser = {
    createdAt: new Date(),
    email: TEST_EMAIL,
    firstName: 'John',
    id: 1,
    isEmailVerified: false,
    lastName: 'Doe',
    logo: null,
    password: TEST_PASSWORD,
    updatedAt: new Date(),
  };

  const mockVerificationToken = {
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 3600000),
    id: 1,
    isUsed: false,
    token: MOCK_TOKEN,
    type: VerificationTokenType.EMAIL_VERIFICATION,
    updatedAt: new Date(),
    userId: 1,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerificationService,
        {
          provide: PrismaService,
          useValue: {
            $transaction: jest.fn((queries) => Promise.resolve(queries)),
            user: {
              update: jest.fn(() => Promise.resolve()),
            },
            verificationToken: {
              create: jest.fn(() => Promise.resolve()),
              findUnique: jest.fn(() => Promise.resolve()),
              update: jest.fn(() => Promise.resolve()),
            },
          },
        },
        {
          provide: UsersService,
          useValue: {
            findByEmail: jest.fn(),
          },
        },
        {
          provide: MailService,
          useValue: {
            sendPasswordReset: jest.fn(),
            sendRegistrationConfirmation: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<VerificationService>(VerificationService);
    prismaService = module.get<PrismaService>(PrismaService);
    usersService = module.get<UsersService>(UsersService);
    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('requestPasswordReset', () => {
    it('should send a password reset email if user exists', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.verificationToken, 'create').mockResolvedValue(mockVerificationToken);

      await service.requestPasswordReset({ email: TEST_EMAIL });

      expect(usersService.findByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(prismaService.verificationToken.create).toHaveBeenCalledWith({
        data: {
          expiresAt: expect.any(Date),
          token: MOCK_TOKEN,
          type: VerificationTokenType.PASSWORD_RESET,
          userId: 1,
        },
      });
      expect(mailService.sendPasswordReset).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        firstName: 'John',
        lastName: 'Doe',
        token: MOCK_TOKEN,
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.requestPasswordReset({ email: NONEXISTENT_EMAIL })).rejects.toThrow(
        new NotFoundException(ErrorMessages.USER_NOT_FOUND),
      );

      expect(prismaService.verificationToken.create).not.toHaveBeenCalled();
      expect(mailService.sendPasswordReset).not.toHaveBeenCalled();
    });
  });

  describe('resetPasswordWithToken', () => {
    it('should reset password with valid token', async () => {
      jest
        .spyOn(prismaService.verificationToken, 'findUnique')
        .mockResolvedValue({ ...mockVerificationToken, type: VerificationTokenType.PASSWORD_RESET });
      (hash as jest.Mock).mockImplementation(() => HASHED_PASSWORD);

      await service.resetPasswordWithToken({ password: NEW_PASSWORD, token: MOCK_TOKEN });

      expect(prismaService.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token: MOCK_TOKEN },
      });
      expect(hash).toHaveBeenCalledWith(NEW_PASSWORD, 10);
      expect(prismaService.$transaction).toHaveBeenCalledWith([expect.any(Object), expect.any(Object)]);
      expect(prismaService.verificationToken.update).toHaveBeenCalledWith({
        data: { isUsed: true },
        where: { id: 1 },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        data: { password: HASHED_PASSWORD },
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if token is not found', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue(null);

      await expect(service.resetPasswordWithToken({ password: NEW_PASSWORD, token: INVALID_TOKEN })).rejects.toThrow(
        new NotFoundException(ErrorMessages.VERIFICATION_TOKEN_NOT_FOUND),
      );
    });

    it('should throw BadRequestException if token is of wrong type', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue(mockVerificationToken);

      await expect(service.resetPasswordWithToken({ password: NEW_PASSWORD, token: MOCK_TOKEN })).rejects.toThrow(
        new BadRequestException(ErrorMessages.INVALID_TOKEN_TYPE),
      );
    });

    it('should throw UnprocessableEntityException if token is already used', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue({
        ...mockVerificationToken,
        isUsed: true,
        type: VerificationTokenType.PASSWORD_RESET,
      });

      await expect(service.resetPasswordWithToken({ password: NEW_PASSWORD, token: MOCK_TOKEN })).rejects.toThrow(
        new UnprocessableEntityException(ErrorMessages.TOKEN_ALREADY_USED),
      );
    });

    it('should throw UnprocessableEntityException if token has expired', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue({
        ...mockVerificationToken,
        expiresAt: new Date(Date.now() - 3600000),
        type: VerificationTokenType.PASSWORD_RESET,
      });

      await expect(service.resetPasswordWithToken({ password: NEW_PASSWORD, token: MOCK_TOKEN })).rejects.toThrow(
        new UnprocessableEntityException(ErrorMessages.TOKEN_EXPIRED),
      );
    });
  });

  describe('sendVerificationEmail', () => {
    it('should send a verification email if user exists and email is not verified', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(prismaService.verificationToken, 'create').mockResolvedValue(mockVerificationToken);

      await service.sendVerificationEmail({ email: TEST_EMAIL });

      expect(usersService.findByEmail).toHaveBeenCalledWith(TEST_EMAIL);
      expect(prismaService.verificationToken.create).toHaveBeenCalledWith({
        data: {
          expiresAt: expect.any(Date),
          token: MOCK_TOKEN,
          type: VerificationTokenType.EMAIL_VERIFICATION,
          userId: 1,
        },
      });
      expect(mailService.sendRegistrationConfirmation).toHaveBeenCalledWith({
        email: TEST_EMAIL,
        firstName: 'John',
        lastName: 'Doe',
        token: MOCK_TOKEN,
      });
    });

    it('should throw NotFoundException if user is not found', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.sendVerificationEmail({ email: NONEXISTENT_EMAIL })).rejects.toThrow(
        new NotFoundException(ErrorMessages.USER_NOT_FOUND),
      );
    });

    it('should throw BadRequestException if email is already verified', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        ...mockUser,
        isEmailVerified: true,
      });

      await expect(service.sendVerificationEmail({ email: TEST_EMAIL })).rejects.toThrow(
        new BadRequestException(ErrorMessages.EMAIL_ALREADY_VERIFIED),
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email with valid token', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue(mockVerificationToken);

      await service.verifyEmail({ token: MOCK_TOKEN });

      expect(prismaService.verificationToken.findUnique).toHaveBeenCalledWith({
        where: { token: MOCK_TOKEN },
      });
      expect(prismaService.$transaction).toHaveBeenCalledWith([expect.any(Object), expect.any(Object)]);
      expect(prismaService.verificationToken.update).toHaveBeenCalledWith({
        data: { isUsed: true },
        where: { id: 1 },
      });
      expect(prismaService.user.update).toHaveBeenCalledWith({
        data: { isEmailVerified: true },
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if token is not found', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue(null);

      await expect(service.verifyEmail({ token: INVALID_TOKEN })).rejects.toThrow(
        new NotFoundException(ErrorMessages.VERIFICATION_TOKEN_NOT_FOUND),
      );
    });

    it('should throw BadRequestException if token is of wrong type', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue({
        ...mockVerificationToken,
        type: VerificationTokenType.PASSWORD_RESET,
      });

      await expect(service.verifyEmail({ token: MOCK_TOKEN })).rejects.toThrow(
        new BadRequestException(ErrorMessages.INVALID_TOKEN_TYPE),
      );
    });

    it('should throw UnprocessableEntityException if token is already used', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue({
        ...mockVerificationToken,
        isUsed: true,
      });

      await expect(service.verifyEmail({ token: MOCK_TOKEN })).rejects.toThrow(
        new UnprocessableEntityException(ErrorMessages.TOKEN_ALREADY_USED),
      );
    });

    it('should throw UnprocessableEntityException if token has expired', async () => {
      jest.spyOn(prismaService.verificationToken, 'findUnique').mockResolvedValue({
        ...mockVerificationToken,
        expiresAt: new Date(Date.now() - 3600000),
      });

      await expect(service.verifyEmail({ token: MOCK_TOKEN })).rejects.toThrow(
        new UnprocessableEntityException(ErrorMessages.TOKEN_EXPIRED),
      );
    });
  });
});
