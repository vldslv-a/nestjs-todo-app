import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { CookieModule } from 'src/cookie/cookie.module';
import { TokenModule } from 'src/token/token.module';
import { UsersModule } from 'src/users/users.module';
import { VerificationModule } from 'src/verification/verification.module';

import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  controllers: [AuthController],
  imports: [UsersModule, TokenModule, PassportModule, CookieModule, VerificationModule],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
