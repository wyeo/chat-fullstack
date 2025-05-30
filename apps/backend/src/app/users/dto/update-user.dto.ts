import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

import { CreateUserDto } from '@backend/users/dto/create-user.dto';

/**
 * DTO for updating user information.
 * Extends CreateUserDto with all fields optional except password,
 * which has its own validation. Used for partial user profile updates.
 */
export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'])
) {
  @ApiPropertyOptional({
    example: 'NewSecurePass123!',
    description: 'New password (optional, minimum 8 characters)',
    minLength: 8,
    format: 'password',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}