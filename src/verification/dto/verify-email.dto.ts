import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyEmailDto {
  @ApiProperty({
    description: 'Verification token sent to email',
    example: '7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d7a9d',
  })
  @IsNotEmpty()
  @IsString()
  public token: string;
}
