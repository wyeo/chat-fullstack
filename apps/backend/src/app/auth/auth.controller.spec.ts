import { Test, TestingModule } from '@nestjs/testing';

import {
  AuthResponseDto,
  UserResponseDto,
} from '@backend/auth/dto/authentication.dto';
import { AuthService } from '@backend/auth/auth.service';
import { UserEntity } from '@backend/users/user.entity';
import { RegisterDto } from '@backend/auth/dto/register.dto';
import { AuthController } from '@backend/auth/auth.controller';

import type { RequestWithUser } from '@backend/auth/interfaces/request-with-user.interface';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser: UserEntity = {
    id: 'test-id',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    isActive: true,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
    fullName: 'John Doe',
  };

  const mockAuthResponse: AuthResponseDto = {
    accessToken: 'mock-jwt-token',
    tokenType: 'Bearer',
    expiresIn: 3600,
    user: new UserResponseDto(mockUser),
  };

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    validateUser: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const registerDto: RegisterDto = {
        email: 'new@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        password: 'password123',
      };

      authService.register.mockResolvedValue(mockAuthResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const req: RequestWithUser = {
        user: mockUser,
      } as RequestWithUser;

      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(req);

      expect(authService.login).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const result = await controller.getProfile(mockUser);

      expect(result).toBeInstanceOf(UserResponseDto);
      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      authService.logout.mockResolvedValue(undefined);

      await controller.logout('test-id');

      expect(authService.logout).toHaveBeenCalledWith('test-id');
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      authService.refreshToken.mockResolvedValue(mockAuthResponse);

      const result = await controller.refreshToken(mockUser);

      expect(authService.refreshToken).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockAuthResponse);
    });
  });

  describe('verifyToken', () => {
    it('should verify token and return user info', async () => {
      const result = await controller.verifyToken(mockUser);

      expect(result.valid).toBe(true);
      expect(result.user).toBeInstanceOf(UserResponseDto);
      expect(result.user.id).toBe(mockUser.id);
    });
  });
});
