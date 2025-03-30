import { ApiProperty } from '@nestjs/swagger';

class ErrorResponse {
  @ApiProperty({ example: 'Unauthorized' })
  public message: string;

  @ApiProperty({ example: 401 })
  public statusCode: number;
}

export class LoginResponse {
  @ApiProperty({
    description: 'JWT access token for authenticating requests',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  public accessToken: string;
}

export class RefreshTokenResponse {
  @ApiProperty({
    description: 'New JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  public accessToken: string;
}

export class UnauthorizedResponse extends ErrorResponse {
  @ApiProperty({ example: 'Invalid credentials' })
  declare public message: string;
}
