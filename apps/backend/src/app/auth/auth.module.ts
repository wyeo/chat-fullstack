import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from '@backend/auth/auth.service';
import { AuthController } from '@backend/auth/auth.controller';

import { JwtAuthGuard } from '@backend/auth/guards/jwt-auth.guard';
import { AdminGuard } from '@backend/auth/guards/admin.guard';

import { JwtStrategy } from '@backend/auth/strategies/jwt.strategy';
import { LocalStrategy } from '@backend/auth/strategies/local.strategy';

import { UsersModule } from '@backend/users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRATION', '1h'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtAuthGuard,
    AdminGuard,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    JwtStrategy,
    LocalStrategy,
  ],
  exports: [AuthService, AdminGuard],
})
export class AuthModule {}
