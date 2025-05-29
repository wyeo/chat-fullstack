import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';

import { UserEntity } from '@backend/users/user.entity';
import { AuthService } from '@backend/auth/auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  /**
   * Validates user credentials using email and password
   * This method is called by Passport Local strategy during login
   * 
   * @param {string} email - The user's email address
   * @param {string} password - The user's plain text password
   * @returns {Promise<UserEntity>} The authenticated user entity
   * @throws {UnauthorizedException} When credentials are invalid
   */
  async validate(email: string, password: string): Promise<UserEntity> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return user;
  }
}
