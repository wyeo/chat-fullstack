import { PartialType, OmitType, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

import { CreateUserDto } from '@backend/users/dto/create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['password'])
) {
  @ApiPropertyOptional({ example: 'NewSecurePass123!' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}