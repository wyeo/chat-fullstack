import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '@backend/auth/guards/jwt-auth.guard';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockExecutionContext: ExecutionContext = {
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({
        url: '/test',
        headers: { authorization: 'Bearer token' },
      }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
    getArgs: jest.fn(),
    getArgByIndex: jest.fn(),
    switchToRpc: jest.fn(),
    switchToWs: jest.fn(),
    getType: jest.fn(),
  } as ExecutionContext;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    reflector = module.get(Reflector);

    jest.spyOn(AuthGuard('jwt').prototype, 'canActivate').mockReturnValue(true);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true for public routes', () => {
      reflector.getAllAndOverride.mockReturnValue(true);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
      expect(result).toBe(true);
    });

    it('should call parent canActivate for protected routes', () => {
      reflector.getAllAndOverride.mockReturnValue(false);

      const result = guard.canActivate(mockExecutionContext);

      expect(reflector.getAllAndOverride).toHaveBeenCalled();
      expect(result).toBe(true);
    });
  });

  describe('handleRequest', () => {
    it('should call parent handleRequest with all parameters', () => {
      const mockUser = { id: 'test-id', email: 'test@example.com' };
      const mockErr = null;
      const mockInfo = 'info';
      const mockContext = {};
      const mockStatus = 200;

      const parentHandleRequest = jest
        .spyOn(AuthGuard('jwt').prototype, 'handleRequest')
        .mockReturnValue(mockUser);

      const result = guard.handleRequest(
        mockErr,
        mockUser,
        mockInfo,
        mockContext,
        mockStatus
      );

      expect(parentHandleRequest).toHaveBeenCalledWith(
        mockErr,
        mockUser,
        mockInfo,
        mockContext,
        mockStatus
      );
      expect(result).toBe(mockUser);
    });

    it('should log error when authentication fails', () => {
      const mockErr = new Error('Auth failed');
      const mockInfo = 'No token';

      const loggerSpy = jest.spyOn(guard['logger'], 'error');
      jest
        .spyOn(AuthGuard('jwt').prototype, 'handleRequest')
        .mockImplementation(() => {
          throw mockErr;
        });

      expect(() => guard.handleRequest(mockErr, null, mockInfo, {})).toThrow(
        mockErr
      );

      expect(loggerSpy).toHaveBeenCalled();
    });
  });
});
