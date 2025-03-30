import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Request,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { getFileUrl } from 'src/files/utils/file.utils';

import { ChangePasswordDto } from '../dto/change-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserProfileDto } from '../dto/user-profile.dto';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: ChangePasswordDto })
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ description: 'Password successfully changed', status: HttpStatus.OK, type: UserProfileDto })
  @ApiResponse({ description: 'Unauthorized or incorrect current password', status: HttpStatus.UNAUTHORIZED })
  @Patch('profile/change-password')
  public async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto): Promise<UserProfileDto> {
    await this.usersService.changePassword(req.user.userId, changePasswordDto);

    return this.getProfile(req);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ description: 'User profile', status: HttpStatus.OK, type: UserProfileDto })
  @ApiResponse({ description: 'Unauthorized', status: HttpStatus.UNAUTHORIZED })
  @ApiResponse({ description: ErrorMessages.USER_NOT_FOUND, status: HttpStatus.NOT_FOUND })
  @Get('profile')
  public async getProfile(@Request() req): Promise<UserProfileDto> {
    const userId = req.user.userId;

    const profile = await this.usersService.getUserProfile(userId);

    if (profile == null) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    return profile;
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Remove user logo' })
  @ApiResponse({ description: 'Logo successfully removed', status: HttpStatus.OK, type: UserProfileDto })
  @ApiResponse({ description: 'Unauthorized', status: HttpStatus.UNAUTHORIZED })
  @ApiResponse({ description: ErrorMessages.USER_NOT_FOUND, status: HttpStatus.NOT_FOUND })
  @Delete('profile/logo')
  public async removeLogo(@Request() req): Promise<UserProfileDto> {
    await this.usersService.updateUserLogo(req.user.userId, null);

    return this.getProfile(req);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiBody({ type: UpdateUserDto })
  @ApiOperation({ summary: 'Update user profile information' })
  @ApiResponse({ description: 'User profile successfully updated', status: HttpStatus.OK, type: UserProfileDto })
  @ApiResponse({ description: 'Unauthorized', status: HttpStatus.UNAUTHORIZED })
  @ApiResponse({ description: ErrorMessages.USER_NOT_FOUND, status: HttpStatus.NOT_FOUND })
  @Patch('profile')
  public async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto): Promise<UserProfileDto> {
    await this.usersService.updateUserInfo(req.user.userId, updateUserDto);

    return this.getProfile(req);
  }

  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      properties: {
        file: {
          description: 'User logo file (jpg, jpeg, png, gif, webp, svg)',
          format: 'binary',
          type: 'string',
        },
      },
      required: ['file'],
      type: 'object',
    },
  })
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload user logo' })
  @ApiResponse({ description: 'Logo successfully uploaded', status: HttpStatus.OK, type: UserProfileDto })
  @ApiResponse({ description: 'Unauthorized', status: HttpStatus.UNAUTHORIZED })
  @ApiResponse({ description: ErrorMessages.USER_NOT_FOUND, status: HttpStatus.NOT_FOUND })
  @ApiUnprocessableEntityResponse({ description: 'Invalid file format or size' })
  @Post('profile/logo')
  @UseInterceptors(FileInterceptor('file'))
  public async uploadLogo(@Request() req, @UploadedFile() file: Express.Multer.File): Promise<UserProfileDto> {
    if (file == null) {
      throw new UnsupportedMediaTypeException('Invalid file format or size');
    }

    const fileUrl = getFileUrl(file.filename, req);

    await this.usersService.updateUserLogo(req.user.userId, fileUrl);

    return this.getProfile(req);
  }
}
