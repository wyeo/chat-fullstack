import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '@backend/users/dto/create-user.dto';
import { UpdateUserDto } from '@backend/users/dto/update-user.dto';

import { UserEntity } from '@backend/users/user.entity';
import { UsersRepository } from '@backend/users/users.repository';
import { AUTH_CONSTANTS } from '@backend/auth/constants/auth.constants';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Creates a new user account with encrypted password
   * 
   * @param {CreateUserDto} createUserDto - User data for account creation
   * @returns {Promise<UserEntity>} The created user entity
   * @throws {ConflictException} When a user with the email already exists
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email
    );

    if (existingUser) {
      throw new ConflictException('A user with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      AUTH_CONSTANTS.BCRYPT_ROUNDS
    );

    const userToCreate = {
      ...createUserDto,
      password: hashedPassword,
    };

    return this.usersRepository.create(userToCreate);
  }

  /**
   * Retrieves all users without sensitive information like passwords
   * 
   * @returns {Promise<UserEntity[]>} Array of user entities with selected fields only
   */
  async findAll(): Promise<UserEntity[]> {
    return this.usersRepository.findAll({
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
  }

  /**
   * Retrieves all users except the specified user, without sensitive information
   * 
   * @param {string} excludeUserId - The ID of the user to exclude from the results
   * @returns {Promise<UserEntity[]>} Array of user entities excluding the specified user
   */
  async findAllExceptUser(excludeUserId: string): Promise<UserEntity[]> {
    const allUsers = await this.findAll();
    return allUsers.filter(user => user.id !== excludeUserId);
  }

  /**
   * Finds a user by their unique ID
   * 
   * @param {string} id - The unique identifier of the user
   * @returns {Promise<UserEntity>} The user entity
   * @throws {NotFoundException} When user with the given ID is not found
   */
  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  /**
   * Finds a user by their email address
   * 
   * @param {string} email - The email address to search for
   * @returns {Promise<UserEntity | null>} The user entity or null if not found
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

  /**
   * Updates an existing user's information with validation
   * 
   * @param {string} id - The unique identifier of the user to update
   * @param {UpdateUserDto} updateUserDto - The user data to update
   * @returns {Promise<UserEntity | null>} The updated user entity or null if not found
   * @throws {NotFoundException} When user with the given ID is not found
   * @throws {ConflictException} When trying to update email to one that already exists
   */
  async update(
    id: string,
    updateUserDto: UpdateUserDto
  ): Promise<UserEntity | null> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findByEmail(
        updateUserDto.email
      );

      if (existingUser) {
        throw new ConflictException(
          'A user with this email already exists'
        );
      }
    }

    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        AUTH_CONSTANTS.BCRYPT_ROUNDS
      );
    }

    return this.usersRepository.update(id, updateUserDto);
  }

  /**
   * Removes a user from the system (soft or hard delete)
   * 
   * @param {string} id - The unique identifier of the user to remove
   * @returns {Promise<void>} Promise that resolves when deletion is complete
   * @throws {BadRequestException} When user deletion fails
   */
  async remove(id: string): Promise<void> {
    const deleted = await this.usersRepository.remove(id);

    if (!deleted) {
      throw new BadRequestException('Unable to delete the user');
    }
  }

  /**
   * Validates user credentials by checking email and password
   * 
   * @param {string} email - The user's email address
   * @param {string} password - The user's plain text password
   * @returns {Promise<UserEntity | null>} The user entity if valid, null otherwise
   */
  async validateUser(
    email: string,
    password: string
  ): Promise<UserEntity | null> {
    const user = await this.usersRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await user.validatePassword(password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }
}
