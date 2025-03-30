import type { VerificationTokenType } from '@prisma/client';

export class CreateVerificationTokenDto {
  public expiresInHours: number;
  public type: VerificationTokenType;
  public userId: number;
}
