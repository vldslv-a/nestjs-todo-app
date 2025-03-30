import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CookieOptions, Response } from 'express';

@Injectable()
export class CookieService {
  public constructor(private readonly configService: ConfigService) {}

  public clearRefreshTokenCookie(response: Response): void {
    response.clearCookie(this.configService.getOrThrow<string>('JWT_REFRESH_COOKIE_NAME'), this.getBaseCookieOptions());
  }

  public setRefreshTokenCookie(response: Response, refreshToken: string): void {
    response.cookie(
      this.configService.getOrThrow<string>('JWT_REFRESH_COOKIE_NAME'),
      refreshToken,
      this.getBaseCookieOptions({ maxAge: this.getRefreshCookieMaxAge() }),
    );
  }

  private getBaseCookieOptions(cookieOptions: CookieOptions = {}): CookieOptions {
    return {
      httpOnly: this.configService.getOrThrow<boolean>('JWT_REFRESH_COOKIE_HTTP_ONLY'),
      path: this.configService.getOrThrow<string>('JWT_REFRESH_COOKIE_PATH'),
      sameSite: this.configService.getOrThrow<'lax' | 'none' | 'strict'>('JWT_REFRESH_COOKIE_SAME_SITE'),
      secure: this.configService.getOrThrow<boolean>('JWT_REFRESH_COOKIE_SECURE'),
      ...cookieOptions,
    };
  }

  private getRefreshCookieMaxAge(): number {
    const days = this.configService.getOrThrow<number>('JWT_REFRESH_COOKIE_MAX_AGE_DAYS');

    return days * 24 * 60 * 60 * 1000;
  }
}
