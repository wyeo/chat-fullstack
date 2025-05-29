import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';

import { AuthService } from '@backend/auth/auth.service';
import { UserEntity } from '@backend/users/user.entity';
import { LocalStrategy } from '@backend/auth/strategies/local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
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

  const mockAuthService = {
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    strategy = module.get<LocalStrategy>(LocalStrategy);
    authService = module.get(AuthService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('validate', () => {
    const email = 'test@example.com';
    const password = 'password123';

    it('should validate and return user for valid credentials', async () => {
      authService.validateUser.mockResolvedValue(mockUser);

      const result = await strategy.validate(email, password);

      expect(authService.validateUser).toHaveBeenCalledWith(email, password);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      authService.validateUser.mockResolvedValue(null);

      await expect(strategy.validate(email, password)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(email, password)).rejects.toThrow(
        'Invalid email or password'
      );
    });
  });
});
