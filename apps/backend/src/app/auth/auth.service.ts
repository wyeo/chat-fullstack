import {
  Logger,
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { plainToClass } from 'class-transformer';

import {
  AuthResponseDto,
  UserResponseDto,
} from '@backend/auth/dto/authentication.dto';
import { RegisterDto } from '@backend/auth/dto/register.dto';
import { UserEntity } from '@backend/users/user.entity';
import { UsersService } from '@backend/users/users.service';
import { JwtPayloadInterface } from '@backend/auth/interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  /**
   * Validates a user's credentials by checking email and password
   * 
   * @param {string} email - The user's email address
   * @param {string} password - The user's plain text password
   * @returns {Promise<UserEntity | null>} The validated user entity or null if invalid
   */
  async validateUser(
    email: string,
    password: string
  ): Promise<UserEntity | null> {
    return this.usersService.validateUser(email, password);
  }

  /**
   * Registers a new user account and returns authentication tokens
   * 
   * @param {RegisterDto} registerDto - The registration data containing user information
   * @returns {Promise<AuthResponseDto>} Authentication response with access token and user data
   * @throws {BadRequestException} When registration fails due to validation or creation errors
   * @throws {ConflictException} When a user with the email already exists (status 409)
   */
  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    try {
      const user = await this.usersService.create({
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        password: registerDto.password,
        isActive: true,
      });

      return this.generateAuthResponse(user);
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'status' in error) {
        if (error.status === 409) {
          throw error;
        }
      }
      throw new BadRequestException("Error during registration");
    }
  }

  /**
   * Authenticates a user and generates JWT tokens for access
   * 
   * @param {UserEntity} user - The validated user entity to authenticate
   * @returns {Promise<AuthResponseDto>} Authentication response with access token and user data
   * @throws {UnauthorizedException} When user is undefined or invalid
   */
  async login(user: UserEntity): Promise<AuthResponseDto> {
    if (!user) {
      this.logger.error('Login failed: user is undefined');
      throw new UnauthorizedException('User not found');
    }

    return this.generateAuthResponse(user);
  }

  /**
   * Generates an authentication response with JWT token and user data
   * 
   * @private
   * @param {UserEntity} user - The user entity to generate tokens for
   * @returns {AuthResponseDto} Complete authentication response with token and user info
   * @throws {UnauthorizedException} When user or user.id is invalid
   */
  private generateAuthResponse(user: UserEntity): AuthResponseDto {
    if (!user || !user.id) {
      this.logger.error(
        'Cannot generate auth response: user or user.id is undefined'
      );
      throw new UnauthorizedException('Invalid user data');
    }

    const payload: JwtPayloadInterface = {
      sub: user.id,
      email: user.email,
    };

    const expiresIn = this.configService.get<string>('JWT_EXPIRATION', '1h');
    const accessToken = this.jwtService.sign(payload);

    const userResponse = plainToClass(UserResponseDto, user, {
      excludeExtraneousValues: true,
    });

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpirationTime(expiresIn),
      user: userResponse,
    };
  }

  /**
   * Parses JWT expiration time string and converts to seconds
   * 
   * @private
   * @param {string} expiration - Expiration string in format like '1h', '30m', '7d', '3600s'
   * @returns {number} Expiration time in seconds (defaults to 3600 if parsing fails)
   */
  private parseExpirationTime(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 3600;
    }

    const [, value, unit] = match;
    const numValue = parseInt(value, 10);

    switch (unit) {
      case 's':
        return numValue;
      case 'm':
        return numValue * 60;
      case 'h':
        return numValue * 3600;
      case 'd':
        return numValue * 86400;
      default:
        return 3600;
    }
  }

  /**
   * Refreshes an existing JWT token by generating a new one for the user
   * 
   * @param {UserEntity} user - The user entity to refresh tokens for
   * @returns {Promise<AuthResponseDto>} New authentication response with fresh tokens
   * @throws {UnauthorizedException} When user is not found or account is deactivated
   */
  async refreshToken(user: UserEntity): Promise<AuthResponseDto> {
    const currentUser = await this.usersService.findOne(user.id);

    if (!currentUser || !currentUser.isActive) {
      throw new UnauthorizedException('Unauthorized user');
    }

    return this.generateAuthResponse(currentUser);
  }

  /**
   * Logs out a user by invalidating their session (currently just logs the action)
   * 
   * @param {string} userId - The ID of the user to log out
   * @returns {Promise<void>} Promise that resolves when logout is complete
   */
  async logout(userId: string): Promise<void> {
    this.logger.log(`User ${userId} logged out`);
    return Promise.resolve();
  }
}
