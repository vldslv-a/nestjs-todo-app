import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { PasswordResetDto } from '../dto/password-reset.dto';
import { RegistrationConfirmationDto } from '../dto/registration-confirmation.dto';
import { SendMailDto } from '../dto/send-mail.dto';

@Injectable()
export class MailService {
  private readonly frontendUrl: string;

  public constructor(
    private readonly mailerService: MailerService,
    private readonly configService: ConfigService,
  ) {
    this.frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  public async sendMail(mailDto: SendMailDto): Promise<void> {
    await this.mailerService.sendMail(mailDto);
  }

  public async sendPasswordReset({ email, firstName, lastName, token }: PasswordResetDto): Promise<void> {
    const resetUrl = `${this.frontendUrl}/reset-password?token=${token}`;

    await this.mailerService.sendMail({
      context: { firstName, lastName, resetUrl },
      subject: 'Password Reset',
      template: './password-reset',
      to: email,
    });
  }

  public async sendRegistrationConfirmation({
    email,
    firstName,
    lastName,
    token,
  }: RegistrationConfirmationDto): Promise<void> {
    const confirmUrl = `${this.frontendUrl}/confirm-registration?token=${token}`;

    await this.mailerService.sendMail({
      context: { confirmUrl, firstName, lastName },
      subject: 'Welcome! Please confirm your registration',
      template: './registration-confirmation',
      to: email,
    });
  }
}
