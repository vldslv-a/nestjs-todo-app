import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ErrorMessages } from 'src/common/constants/error-messages';
import { CookieService } from 'src/cookie/services/cookie.service';
import { Public } from 'src/token/decorators/public.decorator';
import { RequestVerificationDto } from 'src/verification/dto/request-verification.dto';
import { ResetPasswordWithTokenDto } from 'src/verification/dto/reset-password-with-token.dto';
import { VerifyEmailDto } from 'src/verification/dto/verify-email.dto';
import { VerificationService } from 'src/verification/services/verification.service';

import { LoginDto } from '../dto/login.dto';
import { RegistrationDto } from '../dto/registration.dto';
import { LoginResponse, RefreshTokenResponse, UnauthorizedResponse } from '../responses/auth.responses';
import { AuthService } from '../services/auth.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  public constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
    private readonly verificationService: VerificationService,
  ) {}

  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'User successfully logged in',
    type: LoginResponse,
  })
  @ApiOperation({ summary: 'User login' })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
    type: UnauthorizedResponse,
  })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  public async login(@Res({ passthrough: true }) response: Response, @Body() loginDto: LoginDto) {
    const { accessToken, refreshToken } = await this.authService.login(loginDto);

    if (refreshToken) {
      this.cookieService.setRefreshTokenCookie(response, refreshToken);
    }

    return { accessToken };
  }

  @ApiBearerAuth('JWT-auth')
  @ApiOkResponse({
    description: 'User successfully logged out',
  })
  @ApiOperation({ summary: 'User logout' })
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  public async logout(@Res({ passthrough: true }) response: Response) {
    this.cookieService.clearRefreshTokenCookie(response);

    return null;
  }

  @ApiCookieAuth('refresh_token')
  @ApiOkResponse({
    description: 'Token successfully refreshed',
    type: RefreshTokenResponse,
  })
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiUnauthorizedResponse({
    description: 'Invalid or missing refresh token',
    type: UnauthorizedResponse,
  })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @Public()
  public async refreshToken(@Req() req: Request) {
    const refreshToken = req.cookies?.refresh_token;

    if (typeof refreshToken !== 'string') {
      throw new UnauthorizedException(ErrorMessages.REFRESH_TOKEN_REQUIRED);
    }

    const { accessToken } = await this.authService.refreshToken(refreshToken);

    return { accessToken };
  }

  @ApiBody({ type: RegistrationDto })
  @ApiCreatedResponse({
    description: 'User successfully registered',
  })
  @ApiOperation({ summary: 'User registration' })
  @ApiUnauthorizedResponse({
    description: 'User with such email already exists',
    type: UnauthorizedResponse,
  })
  @HttpCode(HttpStatus.CREATED)
  @Post('registration')
  @Public()
  public async registration(@Body() registrationDto: RegistrationDto) {
    return this.authService.registration(registrationDto);
  }

  @ApiOkResponse({ description: 'Email sent with verification link' })
  @ApiOperation({ summary: 'Request repetition of email verification' })
  @HttpCode(HttpStatus.OK)
  @Post('email/resend-confirmation')
  @Public()
  public async requestEmailVerification(@Body() requestVerificationDto: RequestVerificationDto): Promise<void> {
    await this.verificationService.sendVerificationEmail(requestVerificationDto);
  }

  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ description: 'Email sent with password reset link', status: HttpStatus.OK })
  @HttpCode(HttpStatus.OK)
  @Post('password/request-reset')
  @Public()
  public async requestPasswordReset(@Body() requestVerificationDto: RequestVerificationDto): Promise<void> {
    await this.verificationService.requestPasswordReset(requestVerificationDto);
  }

  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ description: 'Password successfully reset', status: HttpStatus.OK })
  @ApiResponse({ description: 'Invalid or expired token', status: HttpStatus.BAD_REQUEST })
  @HttpCode(HttpStatus.OK)
  @Post('password/reset')
  @Public()
  public async resetPasswordUsingToken(@Body() resetPasswordDto: ResetPasswordWithTokenDto): Promise<void> {
    await this.verificationService.resetPasswordWithToken(resetPasswordDto);
  }

  @ApiOperation({ summary: 'Verify email with token' })
  @ApiResponse({ description: 'Email successfully verified', status: HttpStatus.OK })
  @ApiResponse({ description: 'Invalid or expired token', status: HttpStatus.BAD_REQUEST })
  @HttpCode(HttpStatus.OK)
  @Post('email/confirm')
  @Public()
  public async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto): Promise<void> {
    await this.verificationService.verifyEmail(verifyEmailDto);
  }
}
