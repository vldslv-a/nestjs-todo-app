import type { User } from '@prisma/client';

export class JwtUserPayload {
  public email: string;
  public userId: User['id'];
}
