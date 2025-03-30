import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UserProfileDto {
  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  public createdAt: Date;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @Expose()
  public email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @Expose()
  public firstName: string;

  @ApiProperty({
    description: 'User ID',
    example: 1,
  })
  @Expose()
  public id: number;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @Expose()
  public lastName: string;

  @ApiPropertyOptional({
    description: 'User logo/avatar URL',
    example: 'https://example.com/avatar.jpg',
    nullable: true,
  })
  @Expose()
  public logo?: string;

  @ApiProperty({
    description: 'User last update date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @Expose()
  public updatedAt: Date;
}
