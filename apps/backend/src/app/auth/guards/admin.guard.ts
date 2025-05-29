import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the current user has admin privileges to access protected resources
   * 
   * @param {ExecutionContext} context - The execution context of the current request
   * @returns {boolean} True if user is authenticated and has admin role
   * @throws {ForbiddenException} When user is not authenticated or not an admin
   */
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    if (!user.isAdmin) {
      throw new ForbiddenException('Access reserved for administrators');
    }

    return true;
  }
}
