import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';

import { UserEntity } from '@backend/users/user.entity';
import { AdminGuard } from '@backend/auth/guards/admin.guard';

describe('AdminGuard', () => {
  let guard: AdminGuard;

  const mockReflector = {};

  const createMockExecutionContext = (
    user?: Partial<UserEntity> | null
  ): ExecutionContext => {
    return {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
      getArgs: jest.fn(),
      getArgByIndex: jest.fn(),
      switchToRpc: jest.fn(),
      switchToWs: jest.fn(),
      getType: jest.fn(),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for admin users', () => {
      const adminUser = {
        id: 'admin-id',
        email: 'admin@example.com',
        isAdmin: true,
      };
      const context = createMockExecutionContext(adminUser);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw ForbiddenException if user is not authenticated', () => {
      const context = createMockExecutionContext(undefined);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'User not authenticated'
      );
    });

    it('should throw ForbiddenException if user is not admin', () => {
      const regularUser = {
        id: 'user-id',
        email: 'user@example.com',
        isAdmin: false,
      };
      const context = createMockExecutionContext(regularUser);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access reserved for administrators'
      );
    });

    it('should throw ForbiddenException if user.isAdmin is undefined', () => {
      const userWithoutAdminField = {
        id: 'user-id',
        email: 'user@example.com',
      };
      const context = createMockExecutionContext(userWithoutAdminField);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
      expect(() => guard.canActivate(context)).toThrow(
        'Access reserved for administrators'
      );
    });
  });
});
