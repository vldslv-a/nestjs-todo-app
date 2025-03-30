import type { User } from '@prisma/client';

export class OAuthAuthResult {
  public accessToken: string;
  public user: User;
}
