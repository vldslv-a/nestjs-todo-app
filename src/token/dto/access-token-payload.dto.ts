import type { User } from '@prisma/client';

export class AccessTokenPayloadDto {
  public email: string;
  public sub: User['id'];
}
