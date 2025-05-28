import { Test, TestingModule } from '@nestjs/testing';
import {
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { UserEntity } from '@backend/users/user.entity';
import { UsersService } from '@backend/users/users.service';
import { UsersRepository } from '@backend/users/users.repository';
import { CreateUserDto } from '@backend/users/dto/create-user.dto';
import { UpdateUserDto } from '@backend/users/dto/update-user.dto';
import { AUTH_CONSTANTS } from '@backend/auth/constants/auth.constants';

jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: jest.Mocked<UsersRepository>;

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

  const mockUsersRepository = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByEmail: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    usersRepository = module.get(UsersRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Jane',
      lastName: 'Smith',
    };

    it('should create a new user successfully', async () => {
      const hashedPassword = 'hashedPassword123';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.findByEmail.mockResolvedValue(null);
      const createdUser = {
        ...mockUser,
        ...createUserDto,
        password: hashedPassword,
      } as UserEntity;

      usersRepository.create.mockResolvedValue(createdUser);

      const result = await service.create(createUserDto);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        createUserDto.email
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(
        createUserDto.password,
        AUTH_CONSTANTS.BCRYPT_ROUNDS
      );
      expect(usersRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password: hashedPassword,
      });
      expect(result).toEqual(createdUser);
    });

    it('should throw ConflictException if user with email already exists', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException
      );
      await expect(service.create(createUserDto)).rejects.toThrow(
        'Un utilisateur avec cet email existe déjà'
      );
      expect(usersRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return all users with selected fields', async () => {
      const users = [mockUser];
      usersRepository.findAll.mockResolvedValue(users);

      const result = await service.findAll();

      expect(usersRepository.findAll).toHaveBeenCalledWith({
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          isActive: true,
          isAdmin: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne('test-id');

      expect(usersRepository.findOne).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne('non-existent')).rejects.toThrow(
        NotFoundException
      );
      await expect(service.findOne('non-existent')).rejects.toThrow(
        `Utilisateur avec l'ID non-existent non trouvé`
      );
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.findByEmail('non-existent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto } as UserEntity;
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(updatedUser);

      const result = await service.update('test-id', updateUserDto);

      expect(usersRepository.update).toHaveBeenCalledWith(
        'test-id',
        updateUserDto
      );
      expect(result).toEqual(updatedUser);
    });

    it('should hash password if provided', async () => {
      const updateWithPassword: UpdateUserDto = {
        ...updateUserDto,
        password: 'newPassword',
      };
      const hashedPassword = 'hashedNewPassword';
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(mockUser);

      await service.update('test-id', updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith(
        'newPassword',
        AUTH_CONSTANTS.BCRYPT_ROUNDS
      );
      expect(usersRepository.update).toHaveBeenCalledWith('test-id', {
        ...updateWithPassword,
        password: hashedPassword,
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const updateWithEmail: UpdateUserDto = {
        email: 'existing@example.com',
      };
      const existingUser = { ...mockUser, id: 'another-id' } as UserEntity;
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.findByEmail.mockResolvedValue(existingUser);

      await expect(service.update('test-id', updateWithEmail)).rejects.toThrow(
        ConflictException
      );
      await expect(service.update('test-id', updateWithEmail)).rejects.toThrow(
        'Un utilisateur avec cet email existe déjà'
      );
    });

    it('should allow updating to same email', async () => {
      const updateWithSameEmail: UpdateUserDto = {
        email: mockUser.email,
      };
      usersRepository.findOne.mockResolvedValue(mockUser);
      usersRepository.update.mockResolvedValue(mockUser);

      await service.update('test-id', updateWithSameEmail);

      expect(usersRepository.findByEmail).not.toHaveBeenCalled();
      expect(usersRepository.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if user not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent', updateUserDto)
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      usersRepository.remove.mockResolvedValue(true);

      await service.remove('test-id');

      expect(usersRepository.remove).toHaveBeenCalledWith('test-id');
    });

    it('should throw BadRequestException if removal fails', async () => {
      usersRepository.remove.mockResolvedValue(false);

      await expect(service.remove('test-id')).rejects.toThrow(
        BadRequestException
      );
      await expect(service.remove('test-id')).rejects.toThrow(
        "Impossible de supprimer l'utilisateur"
      );
    });
  });

  describe('validateUser', () => {
    it('should return user if credentials are valid', async () => {
      mockUser.validatePassword = jest.fn().mockResolvedValue(true);
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'password123'
      );

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(
        'test@example.com'
      );
      expect(mockUser.validatePassword).toHaveBeenCalledWith('password123');
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser(
        'non-existent@example.com',
        'password'
      );

      expect(result).toBeNull();
    });

    it('should return null if password is invalid', async () => {
      mockUser.validatePassword = jest.fn().mockResolvedValue(false);
      usersRepository.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser(
        'test@example.com',
        'wrongPassword'
      );

      expect(mockUser.validatePassword).toHaveBeenCalledWith('wrongPassword');
      expect(result).toBeNull();
    });
  });
});
