import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address (must be unique)',
    format: 'email',
  })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
    minLength: 2,
    maxLength: 50,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({
    example: 'SecurePass123!',
    description: 'User password (minimum 8 characters)',
    minLength: 8,
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password!: string;

  @ApiPropertyOptional({
    example: true,
    default: true,
    description: 'Indicates if the user account is active',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: false,
    default: false,
    description: 'Defines if the user has administrator privileges',
  })
  @IsOptional()
  @IsBoolean()
  isAdmin?: boolean;
}
