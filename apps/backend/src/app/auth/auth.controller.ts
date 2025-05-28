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

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Inscription d'un nouvel utilisateur" })
  @ApiResponse({
    status: 201,
    description: 'Utilisateur créé avec succès',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Un utilisateur avec cet email existe déjà',
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
  })
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(registerDto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Connexion d'un utilisateur" })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Email ou mot de passe invalide',
  })
  async login(@Request() req: RequestWithUser): Promise<AuthResponseDto> {
    return this.authService.login(req.user);
  }

  @Get('profile')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: "Obtenir le profil de l'utilisateur connecté" })
  @ApiResponse({
    status: 200,
    description: 'Profil utilisateur',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
  })
  async getProfile(@CurrentUser() user: UserEntity): Promise<UserResponseDto> {
    return new UserResponseDto(user);
  }

  @Post('logout')
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Déconnexion de l'utilisateur" })
  @ApiResponse({
    status: 204,
    description: 'Déconnexion réussie',
  })
  async logout(@CurrentUser('id') userId: string): Promise<void> {
    await this.authService.logout(userId);
  }

  @Post('refresh')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Rafraîchir le token JWT' })
  @ApiResponse({
    status: 200,
    description: 'Token rafraîchi',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Token invalide ou expiré',
  })
  async refreshToken(
    @CurrentUser() user: UserEntity
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(user);
  }

  @Get('verify')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Vérifier si le token est valide' })
  @ApiResponse({
    status: 200,
    description: 'Token valide',
    schema: {
      type: 'object',
      properties: {
        valid: { type: 'boolean', example: true },
        user: { type: 'object' },
      },
    },
  })
  async verifyToken(
    @CurrentUser() user: UserEntity
  ): Promise<{ valid: boolean; user: UserResponseDto }> {
    return {
      valid: true,
      user: new UserResponseDto(user),
    };
  }
}
