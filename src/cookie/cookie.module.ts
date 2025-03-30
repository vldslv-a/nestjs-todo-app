import { Module } from '@nestjs/common';

import { CookieService } from './services/cookie.service';

@Module({
  exports: [CookieService],
  providers: [CookieService],
})
export class CookieModule {}
