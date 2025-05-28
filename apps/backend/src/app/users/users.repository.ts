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

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create(createUserDto);
    return this.userRepository.save(user);
  }

  async findAll(options?: FindManyOptions<UserEntity>): Promise<UserEntity[]> {
    return this.userRepository.find(options);
  }

  async findOne(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity | null> {
    const user = await this.findOne(id);
    if (!user) {
      return null;
    }

    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return !!result?.affected;
  }

  async save(user: UserEntity): Promise<UserEntity> {
    return this.userRepository.save(user);
  }
}
