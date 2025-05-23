import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, MinLength } from 'class-validator';

export class ResetPasswordWithTokenDto {
  @ApiProperty({
    description: 'New password (min 8 chars, must include uppercase, lowercase, number, and special character)',
    example: 'NewPass@word123',
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
  @Matches(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
  @Matches(/\d/, { message: 'Password must contain at least one number' })
  @Matches(/[\W_]/, { message: 'Password must contain at least one special character' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  public password: string;

  @ApiProperty({
    description: 'Verification token sent to email',
    example: '7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d',
  })
  @IsNotEmpty()
  @IsString()
  public token: string;
}
