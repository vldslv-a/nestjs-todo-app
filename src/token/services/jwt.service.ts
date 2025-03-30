import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { UsersService } from 'src/users/services/users.service';

import { AccessTokenPayloadDto } from '../dto/access-token-payload.dto';
import { JwtPayloadDto } from '../dto/jwt-payload.dto';
import { RefreshTokenPayloadDto } from '../dto/refresh-token-payload.dto';
import { TokenUserDto } from '../dto/token-user.dto';
import { JwtUserPayload } from '../models/jwt-user-payload.model';
import { TokenResponse } from '../models/token-response.model';

@Injectable()
export class JwtService {
  public constructor(
    private readonly jwtService: NestJwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  public async generateAuthTokens(user: TokenUserDto, includeRefreshToken = false): Promise<TokenResponse> {
    const accessToken = await this.generateAccessToken(user);

    if (!includeRefreshToken) {
      return { accessToken };
    }

    const refreshToken = await this.generateRefreshToken(user.id);

    return { accessToken, refreshToken };
  }

  public async refreshToken(refreshToken: string): Promise<TokenResponse> {
    try {
      const payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.findUserById(payload.sub, ErrorMessages.INVALID_REFRESH_TOKEN);

      return this.generateAuthTokens({ email: user.email, id: user.id }, true);
    } catch {
      throw new UnauthorizedException(ErrorMessages.INVALID_REFRESH_TOKEN);
    }
  }

  public async validatePayload(payload: JwtPayloadDto): Promise<JwtUserPayload> {
    const { email, id } = await this.findUserById(payload.sub, ErrorMessages.INVALID_ACCESS_TOKEN);

    return { email, userId: id };
  }

  private async findUserById(userId: number, errorMessage: string): Promise<User> {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }

  private async generateAccessToken(user: TokenUserDto): Promise<string> {
    return this.signToken({ email: user.email, sub: user.id }, 'JWT_EXPIRES_IN', 'JWT_SECRET');
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    return this.signToken({ sub: userId }, 'JWT_REFRESH_EXPIRES_IN', 'JWT_REFRESH_SECRET');
  }

  private async signToken(
    payload: AccessTokenPayloadDto | RefreshTokenPayloadDto,
    expiresInKey: string,
    secretKey: string,
  ): Promise<string> {
    return this.jwtService.signAsync(payload, {
      expiresIn: this.configService.getOrThrow<string>(expiresInKey),
      secret: this.configService.getOrThrow<string>(secretKey),
    });
  }
}
