import { Test, TestingModule } from '@nestjs/testing';

import { UserEntity } from '@backend/users/user.entity';
import { UsersService } from '@backend/users/users.service';
import { UsersController } from '@backend/users/users.controller';
import { CreateUserDto } from '@backend/users/dto/create-user.dto';
import { UpdateUserDto } from '@backend/users/dto/update-user.dto';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser: UserEntity = {
    id: 'test-id',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    password: 'hashedPassword',
    fullName: 'John Doe',
    isActive: true,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    validatePassword: jest.fn(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findByEmail: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith',
      };

      const expectedUser = { ...mockUser, ...createUserDto } as UserEntity;
      usersService.create.mockResolvedValue(expectedUser);

      const result = await controller.create(createUserDto);

      expect(usersService.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toEqual(expectedUser);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      usersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(usersService.findAll).toHaveBeenCalled();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      usersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('test-id');

      expect(usersService.findOne).toHaveBeenCalledWith('test-id');
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: UpdateUserDto = {
        firstName: 'Updated',
        lastName: 'Name',
      };
      const updatedUser = { ...mockUser, ...updateUserDto } as UserEntity;
      usersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update('test-id', updateUserDto);

      expect(usersService.update).toHaveBeenCalledWith(
        'test-id',
        updateUserDto
      );
      expect(result).toEqual(updatedUser);
    });

    it('should handle null response from service', async () => {
      const updateUserDto: UpdateUserDto = { firstName: 'Updated' };
      usersService.update.mockResolvedValue(null);

      const result = await controller.update('non-existent', updateUserDto);

      expect(result).toBeNull();
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      usersService.remove.mockResolvedValue(undefined);

      await controller.remove('test-id');

      expect(usersService.remove).toHaveBeenCalledWith('test-id');
    });
  });
});
