import { IsEmail, IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user login request.
 * Validates user credentials (email and password) when attempting to authenticate.
 * Used by the authentication controller to process login requests.
 */
export class LoginDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address for login',
    format: 'email',
  })
  @IsEmail({}, { message: 'Invalid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password',
    format: 'password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  password!: string;
}
