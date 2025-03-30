import { Module } from '@nestjs/common';
import { MailModule } from 'src/mail/mail.module';
import { TokenModule } from 'src/token/token.module';
import { UsersModule } from 'src/users/users.module';

import { VerificationService } from './services/verification.service';

@Module({
  controllers: [],
  exports: [VerificationService],
  imports: [UsersModule, MailModule, TokenModule],
  providers: [VerificationService],
})
export class VerificationModule {}
