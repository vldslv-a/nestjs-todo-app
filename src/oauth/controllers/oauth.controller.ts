import { Controller, Get, HttpStatus, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiExcludeEndpoint, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { CookieService } from 'src/cookie/services/cookie.service';
import { Public } from 'src/token/decorators/public.decorator';

import { OAuthUser } from '../models/oauth-user.model';
import { OAuthService } from '../services/oauth.service';

@ApiTags('OAuth Authentication')
@Controller('oauth')
export class OAuthController {
  public constructor(
    private readonly oauthService: OAuthService,
    private readonly configService: ConfigService,
    private readonly cookieService: CookieService,
  ) {}

  @ApiOperation({ summary: 'Start Google OAuth authentication flow' })
  @ApiResponse({
    description: 'Redirects to Google authentication page',
    status: HttpStatus.FOUND,
  })
  @Get('google')
  @Public()
  @UseGuards(AuthGuard('google'))
  public googleAuth() {
    // Guard will handle the redirect
  }

  @ApiExcludeEndpoint()
  @Get('google/callback')
  @Public()
  @UseGuards(AuthGuard('google'))
  public async googleAuthCallback(@Req() req: { user: OAuthUser }, @Res() res: Response) {
    const { accessToken, refreshToken } = await this.oauthService.handleOAuthLogin(req.user);

    if (refreshToken) {
      this.cookieService.setRefreshTokenCookie(res, refreshToken);
    }

    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const redirectUrl = `${frontendUrl}?token=${accessToken}`;

    return res.redirect(redirectUrl);
  }
}
