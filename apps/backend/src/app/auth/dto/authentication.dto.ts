import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

/**
 * DTO for user information in authentication responses.
 * This DTO is used when returning user data after successful authentication,
 * ensuring sensitive information like passwords is excluded from the response.
 */
export class UserResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'Unique user identifier',
  })
  @Expose()
  id!: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
    format: 'email',
  })
  @Expose()
  email!: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @Expose()
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @Expose()
  lastName!: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if the user account is active',
  })
  @Expose()
  isActive!: boolean;

  @ApiProperty({
    example: false,
    description: 'Indicates if the user has administrator privileges',
  })
  @Expose()
  isAdmin!: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Account creation date',
    format: 'date-time',
  })
  @Expose()
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Account last update date',
    format: 'date-time',
  })
  @Expose()
  updatedAt!: Date;

  @Exclude()
  password!: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

/**
 * DTO for authentication response after successful login or registration.
 * Contains the JWT access token and user information needed by the client
 * to authenticate subsequent requests and display user details.
 */
export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT Access Token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken!: string;

  @ApiProperty({
    description: 'Token type',
    example: 'Bearer',
  })
  tokenType!: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 3600,
  })
  expiresIn!: number;

  @ApiProperty({
    description: 'User information',
    type: UserResponseDto,
  })
  user!: UserResponseDto;
}
