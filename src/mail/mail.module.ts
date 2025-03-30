import { join } from 'path';

import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { MailService } from './services/mail.service';

@Module({
  exports: [MailService],
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        defaults: {
          from: `"No Reply" <${config.getOrThrow<string>('MAIL_FROM')}>`,
        },
        template: {
          adapter: new HandlebarsAdapter(),
          dir: join(__dirname, 'templates'),
          options: {
            strict: true,
          },
        },
        transport: {
          auth: {
            pass: config.getOrThrow<string>('MAIL_PASSWORD'),
            user: config.getOrThrow<string>('MAIL_USER'),
          },
          host: config.getOrThrow<string>('MAIL_HOST'),
          secure: config.getOrThrow<boolean>('MAIL_SECURE'),
        },
      }),
    }),
  ],
  providers: [MailService],
})
export class MailModule {}
