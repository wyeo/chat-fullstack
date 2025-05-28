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

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const existingUser = await this.usersRepository.findByEmail(
      createUserDto.email
    );

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
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

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne(id);
    if (!user) {
      throw new NotFoundException(`Utilisateur avec l'ID ${id} non trouvé`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.usersRepository.findByEmail(email);
  }

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
          'Un utilisateur avec cet email existe déjà'
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

  async remove(id: string): Promise<void> {
    const deleted = await this.usersRepository.remove(id);

    if (!deleted) {
      throw new BadRequestException("Impossible de supprimer l'utilisateur");
    }
  }

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
