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

  async validateUser(
    email: string,
    password: string
  ): Promise<UserEntity | null> {
    return this.usersService.validateUser(email, password);
  }

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
      throw new BadRequestException("Erreur lors de l'inscription");
    }
  }

  async login(user: UserEntity): Promise<AuthResponseDto> {
    if (!user) {
      this.logger.error('Login failed: user is undefined');
      throw new UnauthorizedException('User not found');
    }

    return this.generateAuthResponse(user);
  }

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

  async refreshToken(user: UserEntity): Promise<AuthResponseDto> {
    const currentUser = await this.usersService.findOne(user.id);

    if (!currentUser || !currentUser.isActive) {
      throw new UnauthorizedException('Utilisateur non autorisé');
    }

    return this.generateAuthResponse(currentUser);
  }

  async logout(userId: string): Promise<void> {
    this.logger.log(`User ${userId} logged out`);
    return Promise.resolve();
  }
}
