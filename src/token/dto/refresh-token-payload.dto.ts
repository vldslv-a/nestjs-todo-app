import type { User } from '@prisma/client';

export class RefreshTokenPayloadDto {
  public exp?: number;
  public iat?: number;
  public sub: User['id'];
}
