import type { User } from '@prisma/client';

export class TokenUserDto {
  public email: string;
  public id: User['id'];
}
