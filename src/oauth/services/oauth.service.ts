import { Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { hash } from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { TokenResponse } from 'src/token/models/token-response.model';
import { JwtService } from 'src/token/services/jwt.service';
import { UsersService } from 'src/users/services/users.service';

import { OAuthAuthResult } from '../models/oauth-auth-result.model';
import { OAuthUser } from '../models/oauth-user.model';

@Injectable()
export class OAuthService {
  public constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  public async handleOAuthLogin(oauthUser: OAuthUser): Promise<TokenResponse & OAuthAuthResult> {
    const profile = await this.findOAuthProfile(oauthUser);

    if (profile) {
      return this.generateAuthResponse(profile.user);
    }

    const user = await this.findOrCreateUser(oauthUser);

    await this.createOAuthProfile(oauthUser, user.id);

    return this.generateAuthResponse(user);
  }

  private async createNewUser(oauthUser: OAuthUser): Promise<User> {
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await hash(randomPassword, 10);

    return this.usersService.create({
      email: oauthUser.email,
      firstName: oauthUser.firstName,
      isEmailVerified: true,
      lastName: oauthUser.lastName,
      logo: oauthUser.profileImage,
      password: hashedPassword,
    });
  }

  private async createOAuthProfile(oauthUser: OAuthUser, userId: number) {
    return this.prisma.oAuthProfile.create({
      data: {
        email: oauthUser.email,
        firstName: oauthUser.firstName,
        lastName: oauthUser.lastName,
        profileId: oauthUser.profileId,
        profileImage: oauthUser.profileImage,
        provider: oauthUser.provider,
        userId,
      },
    });
  }

  private async findOAuthProfile(oauthUser: OAuthUser) {
    return this.prisma.oAuthProfile.findUnique({
      include: { user: true },
      where: { provider_profileId: { profileId: oauthUser.profileId, provider: oauthUser.provider } },
    });
  }

  private async findOrCreateUser(oauthUser: OAuthUser): Promise<User> {
    let user = await this.usersService.findByEmail(oauthUser.email);

    if (!user) {
      user = await this.createNewUser(oauthUser);
    }

    return user;
  }

  private async generateAuthResponse(user: User): Promise<TokenResponse & OAuthAuthResult> {
    const tokens = await this.jwtService.generateAuthTokens({ email: user.email, id: user.id }, true);

    return { ...tokens, user };
  }
}
