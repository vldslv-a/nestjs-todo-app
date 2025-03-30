import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';

import { OAuthProfile } from '../models/oauth-profile.model';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  public constructor(configService: ConfigService) {
    super({
      callbackURL: configService.getOrThrow<string>('GOOGLE_CALLBACK_URL'),
      clientID: configService.getOrThrow<string>('GOOGLE_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('GOOGLE_CLIENT_SECRET'),
      scope: ['email', 'profile'],
    });
  }

  public async validate(
    _accessToken: string,
    _refreshToken: string,
    profile: OAuthProfile,
    done: VerifyCallback,
  ): Promise<void> {
    const { emails, id, name, photos, provider } = profile;

    const user = {
      email: emails?.[0]?.value ?? '',
      firstName: name?.givenName ?? '',
      lastName: name?.familyName ?? '',
      profileId: id,
      profileImage: photos?.[0]?.value,
      provider,
    };

    done(null, user);
  }
}
