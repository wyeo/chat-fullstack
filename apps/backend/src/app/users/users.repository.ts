import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';

import { UserEntity } from '@backend/users/user.entity';

import { CreateUserDto } from '@backend/users/dto/create-user.dto';
import { UpdateUserDto } from '@backend/users/dto/update-user.dto';

export interface IUsersRepository {
  create(createUserDto: CreateUserDto): Promise<UserEntity>;
  findAll(options?: FindManyOptions<UserEntity>): Promise<UserEntity[]>;
  findOne(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity | null>;
  remove(id: string): Promise<boolean>;
  save(user: UserEntity): Promise<UserEntity>;
}

@Injectable()
export class UsersRepository implements IUsersRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>
  ) {}

  /**
   * Creates a new user in the database
   * 
   * @param {CreateUserDto} createUserDto - User data for creation
   * @returns {Promise<UserEntity>} The created and saved user entity
   */
  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Retrieves all users from the database with optional query options
   * 
   * @param {FindManyOptions<UserEntity>} options - Optional TypeORM find options
   * @returns {Promise<UserEntity[]>} Array of user entities
   */
  async findAll(options?: FindManyOptions<UserEntity>): Promise<UserEntity[]> {
    return this.userRepository.find(options);
  }

  /**
   * Finds a single user by their unique ID
   * 
   * @param {string} id - The unique identifier of the user
   * @returns {Promise<UserEntity | null>} The user entity or null if not found
   */
  async findOne(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  /**
   * Finds a single user by their email address
   * 
   * @param {string} email - The email address to search for
   * @returns {Promise<UserEntity | null>} The user entity or null if not found
   */
  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  /**
   * Updates an existing user with new data
   * 
   * @param {string} id - The unique identifier of the user to update
   * @param {UpdateUserDto} updateUserDto - The updated user data
   * @returns {Promise<UserEntity | null>} The updated user entity or null if not found
   */
  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  /**
   * Removes a user from the database (hard delete)
   * 
   * @param {string} id - The unique identifier of the user to remove
   * @returns {Promise<boolean>} True if user was deleted, false otherwise
   */
  async remove(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return !!result?.affected;
  }

  /**
   * Saves a user entity to the database (create or update)
   * 
   * @param {UserEntity} user - The user entity to save
   * @returns {Promise<UserEntity>} The saved user entity
   */
  async save(user: UserEntity): Promise<UserEntity> {
    return this.userRepository.save(user);
  }
}
