import type { User } from '@prisma/client';

export class JwtPayloadDto {
  public email: string;
  public exp?: number;
  public iat?: number;
  public sub: User['id'];
}
