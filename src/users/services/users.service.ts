import { Injectable, UnauthorizedException } from '@nestjs/common';
import { User } from '@prisma/client';
import { compare, hash } from 'bcrypt';
import { plainToInstance } from 'class-transformer';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { getUserLogoPath, removeFile } from 'src/files/utils/file.utils';
import { PrismaService } from 'src/prisma/prisma.service';

import { ChangePasswordDto } from '../dto/change-password.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserProfileDto } from '../dto/user-profile.dto';

@Injectable()
export class UsersService {
  public constructor(private readonly prisma: PrismaService) {}

  public async changePassword(userId: number, changePasswordDto: ChangePasswordDto): Promise<User> {
    const user = await this.findById(userId);

    if (!user) {
      throw new UnauthorizedException(ErrorMessages.USER_NOT_FOUND);
    }

    const isCurrentPasswordValid = await compare(changePasswordDto.currentPassword, user.password);

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException(ErrorMessages.INCORRECT_PASSWORD);
    }

    const hashedNewPassword = await hash(changePasswordDto.newPassword, 10);

    return this.prisma.user.update({
      data: { password: hashedNewPassword },
      where: { id: userId },
    });
  }

  public async create(createUserDto: CreateUserDto): Promise<User> {
    const user = await this.prisma.user.create({
      data: createUserDto,
    });

    return user;
  }

  public async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },
    });

    return user;
  }

  public async findById(id: number): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
      },
    });

    return user;
  }

  public async getUserProfile(userId: number): Promise<UserProfileDto | null> {
    const user = await this.findById(userId);

    if (!user) {
      return null;
    }

    return plainToInstance(UserProfileDto, user);
  }

  public async updateUserInfo(userId: number, updateUserDto: UpdateUserDto): Promise<User> {
    return this.prisma.user.update({
      data: updateUserDto,
      where: { id: userId },
    });
  }

  public async updateUserLogo(userId: number, logoUrl: string | null): Promise<User> {
    const user = await this.findById(userId);

    if (user?.logo) {
      const oldLogoPath = getUserLogoPath(this.extractFilenameFromUrl(user.logo));

      await removeFile(oldLogoPath).catch(() => {});
    }

    return this.prisma.user.update({
      data: { logo: logoUrl },
      where: { id: userId },
    });
  }

  private extractFilenameFromUrl(url: string): string {
    return url.split('/').pop() || '';
  }
}
