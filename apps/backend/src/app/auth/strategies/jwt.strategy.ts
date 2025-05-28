import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';

import { UserEntity } from '@backend/users/user.entity';
import { UsersService } from '@backend/users/users.service';
import { JwtPayloadInterface } from '@backend/auth/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private usersService: UsersService,
    configService: ConfigService
  ) {
    const secret = configService.get<string>('JWT_SECRET', 'your-secret-key');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
    this.logger.log(
      `JWT Strategy initialized with secret: ${secret.substring(0, 10)}...`
    );
  }

  async validate(payload: JwtPayloadInterface): Promise<UserEntity> {
    this.logger.log(`Validating JWT payload: ${JSON.stringify(payload)}`);

    try {
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        this.logger.error(`User not found with ID: ${payload.sub}`);
        throw new UnauthorizedException('Utilisateur non trouvé');
      }

      if (!user.isActive) {
        this.logger.error(`User account is deactivated: ${user.email}`);
        throw new UnauthorizedException('Compte désactivé');
      }

      this.logger.log(`JWT validation successful for user: ${user.email}`);
      return user;
    } catch (error) {
      this.logger.error(`JWT validation error: ${error}`);
      throw error;
    }
  }
}
