import { Injectable, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';

import type { UserEntity } from '@backend/users/user.entity';
import { IS_PUBLIC_KEY } from '@backend/auth/constants/auth.constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the current request can be activated based on JWT authentication
   * Allows public routes to bypass authentication
   *
   * @param {ExecutionContext} context - The execution context of the current request
   * @returns {boolean | Promise<boolean> | Observable<boolean>} Whether the request is authorized
   */
  override canActivate(
    context: ExecutionContext
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    this.logger.log(`Processing request to: ${request.url}`);
    this.logger.log(`Headers: ${JSON.stringify(request.headers)}`);

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      this.logger.log('Route is public, allowing access');
      return true;
    }

    this.logger.log('Route is protected, checking JWT');
    return super.canActivate(context);
  }

  /**
   * Handles the result of JWT authentication and logs validation details
   *
   * @template TUser - The user type (defaults to UserEntity)
   * @param {unknown} err - Any error that occurred during authentication
   * @param {UserEntity} user - The authenticated user entity
   * @param {unknown} info - Additional authentication info
   * @param {ExecutionContext} context - The execution context
   * @param {unknown} status - Optional status information
   * @returns {TUser} The authenticated user or throws an exception
   */
  override handleRequest<TUser = UserEntity>(
    err: unknown,
    user: UserEntity,
    info: unknown,
    context: ExecutionContext,
    status?: unknown
  ): TUser {
    this.logger.log(
      `JWT validation result - Error: ${err}, User: ${JSON.stringify(
        user
      )}, Info: ${info}`
    );

    if (err || !user) {
      this.logger.error(
        `JWT authentication failed: ${err || info || 'No user found'}`
      );
    }

    return super.handleRequest(err, user, info, context, status);
  }
}
