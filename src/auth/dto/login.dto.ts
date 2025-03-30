import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  @IsNotEmpty()
  public email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Pass@word123',
  })
  @IsNotEmpty()
  @IsString()
  public password: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Option to include refresh token in response',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  public rememberMe?: boolean;
}
