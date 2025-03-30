import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CookieModule } from 'src/cookie/cookie.module';
import { TokenModule } from 'src/token/token.module';
import { UsersModule } from 'src/users/users.module';

import { OAuthController } from './controllers/oauth.controller';
import { OAuthService } from './services/oauth.service';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  controllers: [OAuthController],
  exports: [OAuthService],
  imports: [UsersModule, TokenModule, PassportModule, CookieModule],
  providers: [OAuthService, GoogleStrategy],
})
export class OAuthModule {}
