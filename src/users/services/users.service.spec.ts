import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { compare, hash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { ErrorMessages } from 'src/common/constants/error-messages';
import * as fileUtils from 'src/files/utils/file.utils';
import { PrismaService } from 'src/prisma/prisma.service';

import { UsersService } from './users.service';

import type { ChangePasswordDto } from '../dto/change-password.dto';
import type { CreateUserDto } from '../dto/create-user.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import type { TestingModule } from '@nestjs/testing';
import type { User } from '@prisma/client';

jest.mock('../dto/user-profile.dto', () => {
  class MockUserProfileDto {
    public email: string;
    public firstName: string;
    public id: number;
    public lastName: string;
    public logo: string | null;
  }
  return { UserProfileDto: MockUserProfileDto };
});

import { UserProfileDto } from '../dto/user-profile.dto';

jest.mock('bcrypt');
jest.mock('class-transformer');
jest.mock('src/files/utils/file.utils');

describe('UsersService', () => {
  const HASHED_PASSWORD = 'hashedPassword';
  const NEW_HASHED_PASSWORD = 'newHashedPassword';
  const PATH_TO_OLD_LOGO = '/path/to/old/test-logo.jpg';
  const NEW_LOGO_URL = 'http://example.com/logos/new-logo.jpg';

  let service: UsersService;

  const mockPrismaService = {
    user: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockUser: User = {
    createdAt: new Date(),
    email: 'test@example.com',
    firstName: 'John',
    id: 1,
    isEmailVerified: false,
    lastName: 'Doe',
    logo: null,
    password: HASHED_PASSWORD,
    updatedAt: new Date(),
  };

  const mockUserWithLogo: User = {
    ...mockUser,
    logo: 'http://example.com/logos/test-logo.jpg',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('changePassword', () => {
    it('should change password successfully when correct current password provided', async () => {
      const userId = 1;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      (compare as jest.Mock).mockResolvedValueOnce(true);
      (hash as jest.Mock).mockResolvedValueOnce(NEW_HASHED_PASSWORD);
      mockPrismaService.user.update.mockResolvedValueOnce({ ...mockUser, password: NEW_HASHED_PASSWORD });

      const result = await service.changePassword(userId, changePasswordDto);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({ where: { id: userId } });
      expect(compare).toHaveBeenCalledWith('currentPassword', HASHED_PASSWORD);
      expect(hash).toHaveBeenCalledWith('newPassword', 10);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { password: NEW_HASHED_PASSWORD },
        where: { id: userId },
      });
      expect(result).toEqual({ ...mockUser, password: NEW_HASHED_PASSWORD });
    });

    it('should throw UnauthorizedException when user not found', async () => {
      const userId = 999;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'currentPassword',
        newPassword: 'newPassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.USER_NOT_FOUND),
      );
    });

    it('should throw UnauthorizedException when incorrect current password provided', async () => {
      const userId = 1;
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'wrongPassword',
        newPassword: 'newPassword',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      (compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.changePassword(userId, changePasswordDto)).rejects.toThrow(
        new UnauthorizedException(ErrorMessages.INCORRECT_PASSWORD),
      );
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        firstName: 'firstNameA',
        lastName: 'lastNameA',
        password: HASHED_PASSWORD,
      };

      mockPrismaService.user.create.mockResolvedValueOnce({
        id: 2,
        ...createUserDto,
        createdAt: new Date(),
        logo: null,
        updatedAt: new Date(),
      });

      const result = await service.create(createUserDto);

      expect(mockPrismaService.user.create).toHaveBeenCalledWith({
        data: createUserDto,
      });
      expect(result).toHaveProperty('id', 2);
      expect(result).toHaveProperty('email', 'new@example.com');
    });
  });

  describe('findByEmail', () => {
    it('should find a user by email', async () => {
      const email = 'test@example.com';

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findByEmail(email);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    // eslint-disable-next-line sonarjs/no-duplicate-string
    it('should return null when user not found', async () => {
      const email = 'nonexistent@example.com';

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.findByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      const userId = 1;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);

      const result = await service.findById(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      const userId = 999;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.findById(userId);

      expect(result).toBeNull();
    });
  });

  describe('getUserProfile', () => {
    it('should return user profile when user exists', async () => {
      const userId = 1;
      const userProfileDto = new UserProfileDto();

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      (plainToInstance as jest.Mock).mockReturnValueOnce(userProfileDto);

      const result = await service.getUserProfile(userId);

      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
      });
      expect(plainToInstance).toHaveBeenCalledWith(UserProfileDto, mockUser);
      expect(result).toBe(userProfileDto);
    });

    it('should return null when user not found', async () => {
      const userId = 999;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      const result = await service.getUserProfile(userId);

      expect(result).toBeNull();
    });
  });

  describe('updateUserInfo', () => {
    it('should update user information', async () => {
      const userId = 1;
      const updateUserDto: UpdateUserDto = {
        firstName: 'firstNameB',
        lastName: 'lastNameB',
      };

      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUser,
        ...updateUserDto,
      });

      const result = await service.updateUserInfo(userId, updateUserDto);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: updateUserDto,
        where: { id: userId },
      });
      expect(result).toEqual({
        ...mockUser,
        firstName: 'firstNameB',
        lastName: 'lastNameB',
      });
    });
  });

  describe('updateUserLogo', () => {
    it('should update user logo when no existing logo', async () => {
      const userId = 1;
      const logoUrl = NEW_LOGO_URL;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUser,
        logo: logoUrl,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: logoUrl },
        where: { id: userId },
      });
      expect(result.logo).toEqual(logoUrl);
      expect(fileUtils.removeFile).not.toHaveBeenCalled();
    });

    it('should remove old logo and update with new logo', async () => {
      const userId = 1;
      const logoUrl = NEW_LOGO_URL;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserWithLogo);
      (fileUtils.getUserLogoPath as jest.Mock).mockReturnValueOnce(PATH_TO_OLD_LOGO);
      (fileUtils.removeFile as jest.Mock).mockResolvedValueOnce(undefined);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUserWithLogo,
        logo: logoUrl,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(fileUtils.getUserLogoPath).toHaveBeenCalledWith('test-logo.jpg');
      expect(fileUtils.removeFile).toHaveBeenCalledWith(PATH_TO_OLD_LOGO);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: logoUrl },
        where: { id: userId },
      });
      expect(result.logo).toEqual(logoUrl);
    });

    it('should continue if error occurs while removing old file', async () => {
      const userId = 1;
      const logoUrl = NEW_LOGO_URL;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserWithLogo);
      (fileUtils.getUserLogoPath as jest.Mock).mockReturnValueOnce(PATH_TO_OLD_LOGO);
      (fileUtils.removeFile as jest.Mock).mockRejectedValueOnce(new Error('File not found'));
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUserWithLogo,
        logo: logoUrl,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: logoUrl },
        where: { id: userId },
      });
      expect(result.logo).toEqual(logoUrl);
    });

    it('should set logo to null when logoUrl is null', async () => {
      const userId = 1;
      const logoUrl = null;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserWithLogo);
      (fileUtils.getUserLogoPath as jest.Mock).mockReturnValueOnce(PATH_TO_OLD_LOGO);
      (fileUtils.removeFile as jest.Mock).mockResolvedValueOnce(undefined);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUserWithLogo,
        logo: null,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: null },
        where: { id: userId },
      });
      expect(result.logo).toBeNull();
    });

    it('should handle urls without slashes when removing old logo', async () => {
      const userId = 1;
      const logoUrl = NEW_LOGO_URL;
      const mockUserWithSimpleLogo = {
        ...mockUser,
        logo: 'simple-filename-without-slashes',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserWithSimpleLogo);
      (fileUtils.getUserLogoPath as jest.Mock).mockReturnValueOnce('/path/to/simple-filename-without-slashes');
      (fileUtils.removeFile as jest.Mock).mockResolvedValueOnce(undefined);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUserWithSimpleLogo,
        logo: logoUrl,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(fileUtils.getUserLogoPath).toHaveBeenCalledWith('simple-filename-without-slashes');
      expect(fileUtils.removeFile).toHaveBeenCalledWith('/path/to/simple-filename-without-slashes');
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: logoUrl },
        where: { id: userId },
      });
      expect(result.logo).toEqual(logoUrl);
    });

    it('should handle empty string url when extracting filename', async () => {
      const userId = 1;
      const logoUrl = NEW_LOGO_URL;
      const mockUserWithEmptyLogo = {
        ...mockUser,
        logo: '',
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserWithEmptyLogo);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUserWithEmptyLogo,
        logo: logoUrl,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(fileUtils.getUserLogoPath).not.toHaveBeenCalled();
      expect(fileUtils.removeFile).not.toHaveBeenCalled();

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: logoUrl },
        where: { id: userId },
      });
      expect(result.logo).toEqual(logoUrl);
    });

    it('should correctly extract filename from url', async () => {
      const userId = 1;
      const logoUrl = NEW_LOGO_URL;

      const specialLogo = 'http://example.com/';
      const mockUserWithSpecialLogo = {
        ...mockUser,
        logo: specialLogo,
      };

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserWithSpecialLogo);
      (fileUtils.getUserLogoPath as jest.Mock).mockReturnValueOnce('/path/to/');
      (fileUtils.removeFile as jest.Mock).mockResolvedValueOnce(undefined);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUserWithSpecialLogo,
        logo: logoUrl,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(fileUtils.getUserLogoPath).toHaveBeenCalledWith('');
      expect(fileUtils.removeFile).toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: logoUrl },
        where: { id: userId },
      });
      expect(result.logo).toEqual(logoUrl);
    });

    it('should handle undefined logo property', async () => {
      const userId = 1;
      const logoUrl = NEW_LOGO_URL;

      const mockUserWithUndefinedLogo = {
        ...mockUser,
      };
      // @ts-expect-error - intentionally setting to undefined for test
      mockUserWithUndefinedLogo.logo = undefined;

      mockPrismaService.user.findUnique.mockResolvedValueOnce(mockUserWithUndefinedLogo);
      mockPrismaService.user.update.mockResolvedValueOnce({
        ...mockUser,
        logo: logoUrl,
      });

      const result = await service.updateUserLogo(userId, logoUrl);

      expect(fileUtils.getUserLogoPath).not.toHaveBeenCalled();
      expect(fileUtils.removeFile).not.toHaveBeenCalled();
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        data: { logo: logoUrl },
        where: { id: userId },
      });
      expect(result.logo).toEqual(logoUrl);
    });
  });
});
