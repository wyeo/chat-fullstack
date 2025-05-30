import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  HttpStatus,
  HttpCode,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';

import { UserEntity } from '@backend/users/user.entity';
import { UsersService } from '@backend/users/users.service';
import { CreateUserDto } from '@backend/users/dto/create-user.dto';
import { UpdateUserDto } from '@backend/users/dto/update-user.dto';

import { AdminGuard } from '@backend/auth/guards/admin.guard';
import { UserResponseDto } from '@backend/auth/dto/authentication.dto';
import { JwtAuthGuard } from '@backend/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@backend/auth/decorators/current-user.decorator';

@ApiTags('User Management')
@Controller('users')
@ApiBearerAuth('JWT-auth')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin only',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 403 },
        message: { type: 'string', example: 'Access restricted to administrators' },
        error: { type: 'string', example: 'Forbidden' },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'A user with this email already exists',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 409 },
        message: { type: 'string', example: 'A user with this email already exists' },
        error: { type: 'string', example: 'Conflict' },
      },
    },
  })
  /**
   * Creates a new user account (Admin only)
   * 
   * @param {CreateUserDto} createUserDto - User data for account creation
   * @returns {Promise<UserEntity>} The created user entity
   */
  async create(@Body() createUserDto: CreateUserDto): Promise<UserEntity> {
    return await this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Retrieve all users except the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Users list retrieved successfully (excluding current user)',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Authentication required',
  })
  /**
   * Retrieves all users from the system except the current user
   * 
   * @param {string} currentUserId - The ID of the currently authenticated user
   * @returns {Promise<UserEntity[]>} Array of all user entities excluding the current user
   */
  async findAll(@CurrentUser('id') currentUserId: string): Promise<UserEntity[]> {
    return await this.usersService.findAllExceptUser(currentUserId);
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Retrieve a user by ID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  /**
   * Retrieves a specific user by their ID (Admin only)
   * 
   * @param {string} id - The unique identifier of the user
   * @returns {Promise<UserEntity>} The user entity
   */
  async findOne(@Param('id') id: string): Promise<UserEntity> {
    return await this.usersService.findOne(id);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'A user with this email already exists',
  })
  /**
   * Updates an existing user's information (Admin only)
   * 
   * @param {string} id - The unique identifier of the user to update
   * @param {UpdateUserDto} updateUserDto - The user data to update
   * @returns {Promise<UserEntity | null>} The updated user entity
   */
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto
  ): Promise<UserEntity | null> {
    return await this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({
    status: 204,
    description: 'User deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Access denied - Admin only',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  /**
   * Removes a user from the system (Admin only)
   * 
   * @param {string} id - The unique identifier of the user to remove
   * @returns {Promise<void>} Promise that resolves when deletion is complete
   */
  async remove(@Param('id') id: string): Promise<void> {
    await this.usersService.remove(id);
  }
}
