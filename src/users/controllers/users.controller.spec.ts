import { NotFoundException, UnsupportedMediaTypeException } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { UsersService } from '../services/users.service';

import { UsersController } from './users.controller';

import type { ChangePasswordDto } from '../dto/change-password.dto';
import type { UpdateUserDto } from '../dto/update-user.dto';
import type { UserProfileDto } from '../dto/user-profile.dto';
import type { TestingModule } from '@nestjs/testing';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUser = {
    userId: 123,
  };

  const mockRequest = {
    get: jest.fn().mockReturnValue('localhost'),
    protocol: 'http',
    user: mockUser,
  };

  const mockUserProfile: UserProfileDto = {
    createdAt: new Date(),
    email: 'test@example.com',
    firstName: 'John',
    id: 123,
    lastName: 'Doe',
    logo: 'http://example.com/logo.jpg',
    updatedAt: new Date(),
  };

  const mockUsersService = {
    changePassword: jest.fn(),
    getUserProfile: jest.fn(),
    updateUserInfo: jest.fn(),
    updateUserLogo: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getProfile', () => {
    it('should return the user profile when user exists', async () => {
      mockUsersService.getUserProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.getProfile(mockRequest);

      expect(result).toEqual(mockUserProfile);
      expect(usersService.getUserProfile).toHaveBeenCalledWith(mockUser.userId);
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersService.getUserProfile.mockResolvedValue(null);

      await expect(controller.getProfile(mockRequest)).rejects.toThrow(NotFoundException);
      expect(usersService.getUserProfile).toHaveBeenCalledWith(mockUser.userId);
    });
  });

  describe('updateProfile', () => {
    it('should update user profile and return updated profile', async () => {
      const updateUserDto: UpdateUserDto = { firstName: 'Robert', lastName: 'Hill' };
      mockUsersService.updateUserInfo.mockResolvedValue(undefined);
      mockUsersService.getUserProfile.mockResolvedValue({
        ...mockUserProfile,
        firstName: 'Robert',
        lastName: 'Hill',
      });

      const result = await controller.updateProfile(mockRequest, updateUserDto);

      expect(usersService.updateUserInfo).toHaveBeenCalledWith(mockUser.userId, updateUserDto);
      expect(result).toEqual({
        ...mockUserProfile,
        firstName: 'Robert',
        lastName: 'Hill',
      });
    });
  });

  describe('changePassword', () => {
    it('should change user password and return profile', async () => {
      const changePasswordDto: ChangePasswordDto = {
        currentPassword: 'old-password',
        newPassword: 'new-password',
      };
      mockUsersService.changePassword.mockResolvedValue(undefined);
      mockUsersService.getUserProfile.mockResolvedValue(mockUserProfile);

      const result = await controller.changePassword(mockRequest, changePasswordDto);

      expect(usersService.changePassword).toHaveBeenCalledWith(mockUser.userId, changePasswordDto);
      expect(result).toEqual(mockUserProfile);
    });
  });

  describe('uploadLogo', () => {
    it('should upload logo and return updated profile', async () => {
      const mockFile = {
        filename: 'test-logo.jpg',
      } as Express.Multer.File;

      mockUsersService.updateUserLogo.mockResolvedValue(undefined);
      mockUsersService.getUserProfile.mockResolvedValue({
        ...mockUserProfile,
        logo: 'http://localhost/uploads/test-logo.jpg',
      });

      const result = await controller.uploadLogo(mockRequest, mockFile);

      expect(usersService.updateUserLogo).toHaveBeenCalled();
      expect(result.logo).toContain('test-logo.jpg');
    });

    it('should throw UnsupportedMediaTypeException when no file is provided', async () => {
      // @ts-expect-error - Mocking a missing file
      await expect(controller.uploadLogo(mockRequest, null)).rejects.toThrow(UnsupportedMediaTypeException);
      expect(usersService.updateUserLogo).not.toHaveBeenCalled();
    });
  });

  describe('removeLogo', () => {
    it('should remove logo and return updated profile', async () => {
      mockUsersService.updateUserLogo.mockResolvedValue(undefined);
      mockUsersService.getUserProfile.mockResolvedValue({
        ...mockUserProfile,
        logo: null,
      });

      const result = await controller.removeLogo(mockRequest);

      expect(usersService.updateUserLogo).toHaveBeenCalledWith(mockUser.userId, null);
      expect(result.logo).toBeNull();
    });
  });
});
