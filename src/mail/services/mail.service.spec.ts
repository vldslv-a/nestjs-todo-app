import { MailerService } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';

import { MailService } from './mail.service';

import type { PasswordResetDto } from '../dto/password-reset.dto';
import type { RegistrationConfirmationDto } from '../dto/registration-confirmation.dto';
import type { SendMailDto } from '../dto/send-mail.dto';
import type { TestingModule } from '@nestjs/testing';

describe('MailService', () => {
  const FRONTEND_URL = 'https://frontend-url.com';
  const PASSWORD_RESET_SUBJECT = 'Password Reset';
  const REGISTRATION_CONFIRMATION_SUBJECT = 'Welcome! Please confirm your registration';
  const TEST_EMAIL = 'user@example.com';

  let mailService: MailService;
  let mailerServiceMock: jest.Mocked<MailerService>;
  let configServiceMock: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mailerServiceMock = {
      addTransporter: jest.fn(),
      sendMail: jest.fn(),
      verifyAllTransporters: jest.fn(),
    } as unknown as jest.Mocked<MailerService>;

    configServiceMock = {
      getOrThrow: jest.fn((key: string) => {
        const defaultConfig = {
          FRONTEND_URL,
        };

        if (key in defaultConfig) {
          return defaultConfig[key];
        }

        throw new Error(`Configuration key "${key}" not found`);
      }),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MailService,
        { provide: MailerService, useValue: mailerServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    mailService = module.get<MailService>(MailService);
  });

  it('should be defined', () => {
    expect(mailService).toBeDefined();
  });

  describe('sendMail', () => {
    it('should call mailerService.sendMail with the correct arguments', async () => {
      const mailDto: SendMailDto = {
        context: { key: 'value' },
        subject: 'Test Subject',
        template: './test-template',
        to: 'test@example.com',
      };

      await mailService.sendMail(mailDto);

      expect(mailerServiceMock.sendMail).toHaveBeenCalledWith(mailDto);
    });
  });

  describe('sendPasswordReset', () => {
    it('should send a password reset email with the correct context', async () => {
      const passwordResetDto: PasswordResetDto = {
        email: TEST_EMAIL,
        firstName: 'John',
        lastName: 'Doe',
        token: 'reset-token',
      };

      configServiceMock.getOrThrow.mockReturnValue(FRONTEND_URL);

      await mailService.sendPasswordReset(passwordResetDto);

      expect(mailerServiceMock.sendMail).toHaveBeenCalledWith({
        context: {
          firstName: 'John',
          lastName: 'Doe',
          resetUrl: `${FRONTEND_URL}/reset-password?token=reset-token`,
        },
        subject: PASSWORD_RESET_SUBJECT,
        template: './password-reset',
        to: TEST_EMAIL,
      });
    });
  });

  describe('sendRegistrationConfirmation', () => {
    it('should send a registration confirmation email with the correct context', async () => {
      const registrationConfirmationDto: RegistrationConfirmationDto = {
        email: TEST_EMAIL,
        firstName: 'Jane',
        lastName: 'Doe',
        token: 'confirmation-token',
      };

      configServiceMock.getOrThrow.mockReturnValue(FRONTEND_URL);

      await mailService.sendRegistrationConfirmation(registrationConfirmationDto);

      expect(mailerServiceMock.sendMail).toHaveBeenCalledWith({
        context: {
          confirmUrl: `${FRONTEND_URL}/confirm-registration?token=confirmation-token`,
          firstName: 'Jane',
          lastName: 'Doe',
        },
        subject: REGISTRATION_CONFIRMATION_SUBJECT,
        template: './registration-confirmation',
        to: TEST_EMAIL,
      });
    });
  });
});
