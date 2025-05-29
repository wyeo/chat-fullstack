import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Socket } from 'socket.io';

import { WsJwtGuard } from './ws-jwt.guard';

describe('WsJwtGuard', () => {
  let guard: WsJwtGuard;
  let jwtService: JwtService;
  let configService: ConfigService;

  const mockJwtPayload = {
    sub: 'user123',
    email: 'test@example.com',
    iat: 1234567890,
    exp: 1234567890,
  };

  const createMockSocket = (token?: string, location: 'auth' | 'header' | 'query' = 'auth') => {
    const socket: Partial<Socket> = {
      id: 'socket123',
      handshake: {
        auth: location === 'auth' ? { token } : {},
        headers: location === 'header' ? { authorization: token ? `Bearer ${token}` : undefined } : {},
        query: location === 'query' ? { token } : {},
        issued: 1234567890,
        secure: true,
        time: 'test',
        url: '/chat',
        xdomain: false,
      } as any,
    };
    return socket as Socket & { userId?: string; userEmail?: string };
  };

  const createMockExecutionContext = (socket: Socket): ExecutionContext => {
    return {
      switchToWs: () => ({
        getClient: () => socket,
        getData: () => ({}),
      }),
    } as ExecutionContext;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WsJwtGuard,
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    guard = module.get<WsJwtGuard>(WsJwtGuard);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    // Setup default mocks
    jest.spyOn(configService, 'get').mockReturnValue('test-secret');
    jest.spyOn(jwtService, 'verify').mockReturnValue(mockJwtPayload);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('canActivate', () => {
    it('should return true with valid token in auth', async () => {
      const socket = createMockSocket('valid.jwt.token', 'auth');
      const context = createMockExecutionContext(socket);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token', {
        secret: 'test-secret',
      });
      expect(socket.userId).toBe('user123');
      expect(socket.userEmail).toBe('test@example.com');
    });

    it('should return true with valid token in header', async () => {
      const socket = createMockSocket('valid.jwt.token', 'header');
      const context = createMockExecutionContext(socket);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token', {
        secret: 'test-secret',
      });
      expect(socket.userId).toBe('user123');
      expect(socket.userEmail).toBe('test@example.com');
    });

    it('should return true with valid token in query', async () => {
      const socket = createMockSocket('valid.jwt.token', 'query');
      const context = createMockExecutionContext(socket);

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token', {
        secret: 'test-secret',
      });
      expect(socket.userId).toBe('user123');
      expect(socket.userEmail).toBe('test@example.com');
    });

    it('should throw WsException if no token provided', async () => {
      const socket = createMockSocket();
      const context = createMockExecutionContext(socket);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('No token provided')
      );
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it('should throw WsException if token verification fails', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const socket = createMockSocket('invalid.jwt.token');
      const context = createMockExecutionContext(socket);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('Invalid token')
      );
    });

    it('should throw WsException if token is expired', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt expired');
      });

      const socket = createMockSocket('expired.jwt.token');
      const context = createMockExecutionContext(socket);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('Invalid token')
      );
    });

    it('should throw WsException if token is malformed', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('jwt malformed');
      });

      const socket = createMockSocket('malformed.token');
      const context = createMockExecutionContext(socket);

      await expect(guard.canActivate(context)).rejects.toThrow(
        new WsException('Invalid token')
      );
    });
  });

  describe('extractTokenFromClient', () => {
    it('should extract token from auth object', () => {
      const socket = createMockSocket('auth.token', 'auth');
      const token = guard['extractTokenFromClient'](socket);

      expect(token).toBe('auth.token');
    });

    it('should extract token from authorization header', () => {
      const socket = createMockSocket('header.token', 'header');
      const token = guard['extractTokenFromClient'](socket);

      expect(token).toBe('header.token');
    });

    it('should extract token from query parameters', () => {
      const socket = createMockSocket('query.token', 'query');
      const token = guard['extractTokenFromClient'](socket);

      expect(token).toBe('query.token');
    });

    it('should prioritize auth token over header token', () => {
      const socket = createMockSocket('auth.token', 'auth');
      socket.handshake.headers = { authorization: 'Bearer header.token' };
      socket.handshake.query = { token: 'query.token' } as any;

      const token = guard['extractTokenFromClient'](socket);

      expect(token).toBe('auth.token');
    });

    it('should prioritize header token over query token', () => {
      const socket = createMockSocket('header.token', 'header');
      socket.handshake.query = { token: 'query.token' } as any;

      const token = guard['extractTokenFromClient'](socket);

      expect(token).toBe('header.token');
    });

    it('should return undefined if no token found', () => {
      const socket = createMockSocket();
      const token = guard['extractTokenFromClient'](socket);

      expect(token).toBeUndefined();
    });

    it('should handle malformed authorization header', () => {
      const socket = createMockSocket();
      socket.handshake.headers = { authorization: 'InvalidFormat' };

      const token = guard['extractTokenFromClient'](socket);

      expect(token).toBeUndefined();
    });
  });

  describe('token payload handling', () => {
    it('should set userId and userEmail from token payload', async () => {
      const customPayload = {
        sub: 'customUser456',
        email: 'custom@example.com',
        iat: 1234567890,
        exp: 1234567890,
      };
      jest.spyOn(jwtService, 'verify').mockReturnValue(customPayload);

      const socket = createMockSocket('valid.jwt.token');
      const context = createMockExecutionContext(socket);

      await guard.canActivate(context);

      expect(socket.userId).toBe('customUser456');
      expect(socket.userEmail).toBe('custom@example.com');
    });

    it('should handle missing email in payload', async () => {
      const payloadWithoutEmail = {
        sub: 'user789',
        iat: 1234567890,
        exp: 1234567890,
      };
      jest.spyOn(jwtService, 'verify').mockReturnValue(payloadWithoutEmail);

      const socket = createMockSocket('valid.jwt.token');
      const context = createMockExecutionContext(socket);

      await guard.canActivate(context);

      expect(socket.userId).toBe('user789');
      expect(socket.userEmail).toBeUndefined();
    });
  });
});