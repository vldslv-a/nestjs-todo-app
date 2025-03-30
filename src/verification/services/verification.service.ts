import { randomBytes } from 'crypto';

import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { VerificationTokenType } from '@prisma/client';
import { hash } from 'bcrypt';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { MailService } from 'src/mail/services/mail.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/services/users.service';

import { CreateVerificationTokenDto } from '../dto/create-verification-token.dto';
import { RequestVerificationDto } from '../dto/request-verification.dto';
import { ResetPasswordWithTokenDto } from '../dto/reset-password-with-token.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';

@Injectable()
export class VerificationService {
  public constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly mailService: MailService,
  ) {}

  public async requestPasswordReset({ email }: RequestVerificationDto): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    const token = await this.createVerificationToken({
      expiresInHours: 1,
      type: VerificationTokenType.PASSWORD_RESET,
      userId: user.id,
    });

    await this.mailService.sendPasswordReset({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
    });
  }

  public async resetPasswordWithToken({ password, token }: ResetPasswordWithTokenDto): Promise<void> {
    const { id, userId } = await this.validateToken(token, VerificationTokenType.PASSWORD_RESET);

    const hashedPassword = await hash(password, 10);

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({ data: { isUsed: true }, where: { id } }),

      this.prisma.user.update({ data: { password: hashedPassword }, where: { id: userId } }),
    ]);
  }

  public async sendVerificationEmail({ email }: RequestVerificationDto): Promise<void> {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      throw new NotFoundException(ErrorMessages.USER_NOT_FOUND);
    }

    if (user.isEmailVerified) {
      throw new BadRequestException(ErrorMessages.EMAIL_ALREADY_VERIFIED);
    }

    const token = await this.createVerificationToken({
      expiresInHours: 24,
      type: VerificationTokenType.EMAIL_VERIFICATION,
      userId: user.id,
    });

    await this.mailService.sendRegistrationConfirmation({
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      token,
    });
  }

  public async verifyEmail({ token }: VerifyEmailDto): Promise<void> {
    const { id, userId } = await this.validateToken(token, VerificationTokenType.EMAIL_VERIFICATION);

    await this.prisma.$transaction([
      this.prisma.verificationToken.update({ data: { isUsed: true }, where: { id } }),

      this.prisma.user.update({ data: { isEmailVerified: true }, where: { id: userId } }),
    ]);
  }

  private async createVerificationToken({ expiresInHours, type, userId }: CreateVerificationTokenDto): Promise<string> {
    const tokenString = randomBytes(32).toString('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + expiresInHours);

    await this.prisma.verificationToken.create({
      data: { expiresAt, token: tokenString, type, userId },
    });

    return tokenString;
  }

  private async validateToken(token: string, type: VerificationTokenType) {
    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: { token },
    });

    if (!verificationToken) {
      throw new NotFoundException(ErrorMessages.VERIFICATION_TOKEN_NOT_FOUND);
    }

    if (verificationToken.type !== type) {
      throw new BadRequestException(ErrorMessages.INVALID_TOKEN_TYPE);
    }

    if (verificationToken.isUsed) {
      throw new UnprocessableEntityException(ErrorMessages.TOKEN_ALREADY_USED);
    }

    const now = new Date();
    if (verificationToken.expiresAt < now) {
      throw new UnprocessableEntityException(ErrorMessages.TOKEN_EXPIRED);
    }

    return verificationToken;
  }
}
