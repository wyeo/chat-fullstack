import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';

import { UserEntity } from '@backend/users/user.entity';
import { UsersRepository } from '@backend/users/users.repository';
import { CreateUserDto } from '@backend/users/dto/create-user.dto';
import { UpdateUserDto } from '@backend/users/dto/update-user.dto';

describe('UsersRepository', () => {
  let repository: UsersRepository;
  let typeOrmRepository: jest.Mocked<Repository<UserEntity>>;

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

  const mockTypeOrmRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockTypeOrmRepository,
        },
      ],
    }).compile();

    repository = module.get<UsersRepository>(UsersRepository);
    typeOrmRepository = module.get(getRepositoryToken(UserEntity));
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  describe('create', () => {
    it('should create and save a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'hashedPassword',
        firstName: 'Jane',
        lastName: 'Smith',
      };
      const newUser = { ...mockUser, ...createUserDto } as UserEntity;

      typeOrmRepository.create.mockReturnValue(newUser);
      typeOrmRepository.save.mockResolvedValue(newUser);

      const result = await repository.create(createUserDto);

      expect(typeOrmRepository.create).toHaveBeenCalledWith(createUserDto);
      expect(typeOrmRepository.save).toHaveBeenCalledWith(newUser);
      expect(result).toEqual(newUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      typeOrmRepository.find.mockResolvedValue(users);

      const result = await repository.findAll();

      expect(typeOrmRepository.find).toHaveBeenCalledWith(undefined);
      expect(result).toEqual(users);
    });

    it('should accept find options', async () => {
      const users = [mockUser];
      const options = {
        select: {
          id: true as const,
          email: true as const,
        },
      };
      typeOrmRepository.find.mockResolvedValue(users);

      const result = await repository.findAll(options);

      expect(typeOrmRepository.find).toHaveBeenCalledWith(options);
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findOne('test-id');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findOne('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user by email', async () => {
      typeOrmRepository.findOne.mockResolvedValue(mockUser);

      const result = await repository.findByEmail('test@example.com');

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.findByEmail('non-existent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a user successfully', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      const updatedUser = { ...mockUser, ...updateUserDto } as UserEntity;

      typeOrmRepository.findOne.mockResolvedValue(mockUser);
      typeOrmRepository.save.mockResolvedValue(updatedUser);

      const result = await repository.update('test-id', updateUserDto);

      expect(typeOrmRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'test-id' },
      });
      expect(typeOrmRepository.save).toHaveBeenCalledWith(
        expect.objectContaining(updateUserDto)
      );
      expect(result).toEqual(updatedUser);
    });

    it('should return null if user not found', async () => {
      typeOrmRepository.findOne.mockResolvedValue(null);

      const result = await repository.update('non-existent', {
        firstName: 'Updated',
      });

      expect(typeOrmRepository.save).not.toHaveBeenCalled();
      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a user successfully', async () => {
      typeOrmRepository.delete.mockResolvedValue({
        affected: 1,
        raw: [],
      });

      const result = await repository.remove('test-id');

      expect(typeOrmRepository.delete).toHaveBeenCalledWith('test-id');
      expect(result).toBe(true);
    });

    it('should return false if user not found', async () => {
      typeOrmRepository.delete.mockResolvedValue({
        affected: 0,
        raw: [],
      });

      const result = await repository.remove('non-existent');

      expect(result).toBe(false);
    });
  });

  describe('save', () => {
    it('should save a user entity', async () => {
      typeOrmRepository.save.mockResolvedValue(mockUser);

      const result = await repository.save(mockUser);

      expect(typeOrmRepository.save).toHaveBeenCalledWith(mockUser);
      expect(result).toEqual(mockUser);
    });
  });
});
