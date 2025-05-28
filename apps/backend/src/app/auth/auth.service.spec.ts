import {
  ConflictException,
  BadRequestException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { UserEntity } from '@backend/users/user.entity';
import { AuthService } from '@backend/auth/auth.service';
import { UsersService } from '@backend/users/users.service';
import { RegisterDto } from '@backend/auth/dto/register.dto';

jest.mock('class-transformer', () => ({
  plainToClass: jest.fn((_, obj) => obj),
  Expose: () => () => ({}),
  Exclude: () => () => ({}),
}));

jest.mock('@nestjs/swagger', () => ({
  ApiProperty: () => () => ({}),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;
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
    findByEmail: jest.fn(),
    create: jest.fn(),
    validateUser: jest.fn(),
    findOne: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get(UsersService);
    jwtService = module.get(JwtService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate user credentials successfully', async () => {
      usersService.validateUser.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(usersService.validateUser).toHaveBeenCalledWith(
        'test@example.com',
        'password'
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null for invalid credentials', async () => {
      usersService.validateUser.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'wrong');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      email: 'new@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      password: 'password123',
    };

    it('should register a new user successfully', async () => {
      const newUser = { ...mockUser, ...registerDto } as UserEntity;
      usersService.create.mockResolvedValue(newUser);
      configService.get.mockReturnValue('1h');
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.register(registerDto);

      expect(usersService.create).toHaveBeenCalledWith({
        ...registerDto,
        isActive: true,
      });
      expect(result).toMatchObject({
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const conflictError = new ConflictException();
      Object.defineProperty(conflictError, 'status', {
        value: 409,
        writable: true,
      });
      usersService.create.mockRejectedValue(conflictError);

      await expect(service.register(registerDto)).rejects.toThrow(
        ConflictException
      );
    });

    it('should throw BadRequestException for other errors', async () => {
      usersService.create.mockRejectedValue(new Error('Database error'));

      await expect(service.register(registerDto)).rejects.toThrow(
        BadRequestException
      );
      await expect(service.register(registerDto)).rejects.toThrow(
        "Erreur lors de l'inscription"
      );
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      configService.get.mockReturnValue('1h');
      jwtService.sign.mockReturnValue('mock-jwt-token');

      const result = await service.login(mockUser);

      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: mockUser.id,
        email: mockUser.email,
      });
      expect(result).toMatchObject({
        accessToken: 'mock-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    });

    it('should throw UnauthorizedException if user is null', async () => {
      const nullUser = null as unknown as UserEntity;
      
      await expect(service.login(nullUser)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(nullUser)).rejects.toThrow('User not found');
    });
  });

  describe('generateAuthResponse', () => {
    it('should generate auth response with different expiration units', async () => {
      jwtService.sign.mockReturnValue('mock-jwt-token');

      configService.get.mockReturnValue('30s');
      let result = await service.login(mockUser);
      expect(result.expiresIn).toBe(30);

      configService.get.mockReturnValue('15m');
      result = await service.login(mockUser);
      expect(result.expiresIn).toBe(900);

      configService.get.mockReturnValue('2h');
      result = await service.login(mockUser);
      expect(result.expiresIn).toBe(7200);
      configService.get.mockReturnValue('7d');
      result = await service.login(mockUser);
      expect(result.expiresIn).toBe(604800);

      configService.get.mockReturnValue('invalid');
      result = await service.login(mockUser);
      expect(result.expiresIn).toBe(3600);
    });

    it('should throw UnauthorizedException if user.id is undefined', async () => {
      const invalidUser: Partial<UserEntity> = {
        ...mockUser,
        id: undefined,
      };

      await expect(service.login(invalidUser as UserEntity)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.login(invalidUser as UserEntity)).rejects.toThrow(
        'Invalid user data'
      );
    });
  });

  describe('refreshToken', () => {
    it('should refresh token for active user', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      configService.get.mockReturnValue('1h');
      jwtService.sign.mockReturnValue('new-jwt-token');

      const result = await service.refreshToken(mockUser);

      expect(usersService.findOne).toHaveBeenCalledWith(mockUser.id);
      expect(result).toMatchObject({
        accessToken: 'new-jwt-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
      });
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersService.findOne.mockRejectedValue(
        new NotFoundException(`Utilisateur avec l'ID ${mockUser.id} non trouvé`)
      );

      await expect(service.refreshToken(mockUser)).rejects.toThrow(
        NotFoundException
      );
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      const inactiveUser = { ...mockUser, isActive: false } as UserEntity;
      usersService.findOne.mockResolvedValue(inactiveUser);

      await expect(service.refreshToken(mockUser)).rejects.toThrow(
        UnauthorizedException
      );
      await expect(service.refreshToken(mockUser)).rejects.toThrow(
        'Utilisateur non autorisé'
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      await expect(service.logout('test-id')).resolves.toBeUndefined();
    });
  });
});
