import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Get,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from '@backend/auth/auth.service';

import { Public } from '@backend/auth/decorators/public.decorator';
import { CurrentUser } from '@backend/auth/decorators/current-user.decorator';

import {
  AuthResponseDto,
  UserResponseDto,
} from '@backend/auth/dto/authentication.dto';
import { LoginDto } from '@backend/auth/dto/login.dto';
import { RegisterDto } from '@backend/auth/dto/register.dto';

import { UserEntity } from '@backend/users/user.entity';

import { LocalAuthGuard } from '@backend/auth/guards/local-auth.guard';

import type { RequestWithUser } from '@backend/auth/interfaces/request-with-user.interface';

@ApiTags('Authentication & User Session')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'New user registration' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid data - Validation error',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' }, example: ['Invalid email', 'Password too short'] },
        error: { type: 'string', example: 'Bad Request' },
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
   * Registers a new user account
   *
   * @param {RegisterDto} registerDto - User registration data including email, name, and password
   * @returns {Promise<AuthResponseDto>} Authentication response with access token and user data
   */
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login' })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid email or password',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 401 },
        message: { type: 'string', example: 'Invalid email or password' },
        error: { type: 'string', example: 'Unauthorized' },
      },
    },
  })
  /**
   * Authenticates a user with email and password
   *
   * @param {RequestWithUser} req - Express request object containing the authenticated user
   * @returns {Promise<AuthResponseDto>} Authentication response with access token and user data
   */
  async login(@Request() req: RequestWithUser): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
  })
  /**
   * Retrieves the profile of the currently authenticated user
   *
   * @param {UserEntity} user - The authenticated user entity from JWT token
   * @returns {Promise<UserResponseDto>} User profile data without sensitive information
   */
  async getProfile(@CurrentUser() user: UserEntity): Promise<UserResponseDto> {
    return new UserResponseDto(user);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'User logout' })
  @ApiResponse({
    status: 204,
    description: 'Logout successful',
  })
  /**
   * Logs out the current user by invalidating their session
   *
   * @param {string} userId - The ID of the user to log out
   * @returns {Promise<void>} Promise that resolves when logout is complete
   */
  async logout(@CurrentUser('id') userId: string): Promise<void> {
    await this.authService.logout(userId);
  }

  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Refresh JWT token' })
  @ApiResponse({
    status: 200,
    description: 'Token refreshed',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired token',
  })
  /**
   * Refreshes the JWT token for the authenticated user
   *
   * @param {UserEntity} user - The authenticated user entity from current JWT token
   * @returns {Promise<AuthResponseDto>} New authentication response with fresh token
   */
  async refreshToken(
    @CurrentUser() user: UserEntity
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(user);
  }

  @Get('verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Verify if token is valid' })
  @ApiResponse({
    status: 200,
    description: 'Token is valid',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: { type: 'object' },
      },
    },
  })
  /**
   * Verifies if the current JWT token is valid and returns user information
   *
   * @param {UserEntity} user - The authenticated user entity from JWT token
   * @returns {Promise<{valid: boolean, user: UserResponseDto}>} Verification result with user data
   */
  async verifyToken(
    @CurrentUser() user: UserEntity
  ): Promise<{ valid: boolean; user: UserResponseDto }> {
    return {
      valid: true,
      user: new UserResponseDto(user),
    };
  }
}
