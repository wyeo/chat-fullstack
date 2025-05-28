import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, NotFoundException } from '@nestjs/common';

import { UserEntity } from '@backend/users/user.entity';
import { UsersService } from '@backend/users/users.service';
import { JwtStrategy } from '@backend/auth/strategies/jwt.strategy';
import { JwtPayloadInterface } from '@backend/auth/interfaces/jwt-payload.interface';

jest.mock('passport-jwt', () => {
  const mockStrategy = jest.fn();
  mockStrategy.prototype.name = 'jwt';
  return {
    Strategy: mockStrategy,
    ExtractJwt: {
      fromAuthHeaderAsBearerToken: jest.fn(() => 'mockExtractor'),
    },
  };
});

interface MockStrategy {
  name?: string;
}

type MockStrategyConstructor = new (...args: unknown[]) => MockStrategy;

jest.mock('@nestjs/passport', () => ({
  PassportStrategy: (Strategy: MockStrategyConstructor) => {
    return class extends Strategy {
      constructor(...args: unknown[]) {
        super(...args);
      }
    };
  },
}));

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: jest.Mocked<UsersService>;
  let configService: jest.Mocked<ConfigService>;

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

  const mockUsersService = {
    findOne: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('test-secret-key'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockReturnValue('test-secret-key');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
    usersService = module.get(UsersService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  it('should configure with correct options', () => {
    expect(configService.get).toHaveBeenCalledWith(
      'JWT_SECRET',
      'your-secret-key'
    );
  });

  describe('validate', () => {
    const payload: JwtPayloadInterface = {
      sub: 'test-id',
      email: 'test@example.com',
    };

    it('should validate and return user for valid payload', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await strategy.validate(payload);

      expect(usersService.findOne).toHaveBeenCalledWith(payload.sub);
      expect(result).toEqual(mockUser);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findOne.mockRejectedValue(
        new NotFoundException(`Utilisateur avec l'ID ${payload.sub} non trouvé`)
      );

      await expect(strategy.validate(payload)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false } as UserEntity;
      usersService.findOne.mockResolvedValue(inactiveUser);

      await expect(strategy.validate(payload)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(strategy.validate(payload)).rejects.toThrow(
        'Compte désactivé'
      );
    });

    it('should propagate other errors', async () => {
      const error = new Error('Database error');
      usersService.findOne.mockRejectedValue(error);

      await expect(strategy.validate(payload)).rejects.toThrow(error);
    });
  });
});
