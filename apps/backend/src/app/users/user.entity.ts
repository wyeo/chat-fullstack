import {
  Index,
  Entity,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Exclude } from 'class-transformer';

/**
 * User entity stored in PostgreSQL
 * 
 * This entity represents registered users in the system.
 * PostgreSQL is used for user data because it provides:
 * - Strong referential integrity
 * - ACID transactions for critical operations
 * - Better structure for future relationships (friends, contacts, etc.)
 * - Advanced search capabilities on profiles
 * 
 * @entity users - PostgreSQL users table
 */
@Entity('users')
export class UserEntity {
  /**
   * Unique user identifier (UUID v4)
   * Automatically generated on creation
   */
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  /**
   * Unique user email address
   * Used for authentication and communications
   * Indexed for optimal search performance
   */
  @Column({ unique: true })
  @Index()
  email!: string;

  /**
   * User's first name
   * Used for display and personalization
   */
  @Column({ name: 'first_name' })
  firstName!: string;

  /**
   * User's last name
   * Used for display and personalization
   */
  @Column({ name: 'last_name' })
  lastName!: string;

  /**
   * Password hashed with bcrypt
   * Never exposed in API responses thanks to @Exclude
   * Required complexity: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
   */
  @Column()
  @Exclude()
  password!: string;

  /**
   * Account activation status
   * false = account disabled/suspended
   * true = active account (default)
   * Used to block access without deleting data
   */
  @Column({ name: 'is_active', default: true })
  isActive!: boolean;

  /**
   * Administrator privileges indicator
   * false = standard user (default)
   * true = administrator with extended access
   * Used by guards to control access to admin features
   */
  @Column({ name: 'is_admin', default: false })
  isAdmin!: boolean;

  /**
   * Account creation date and time
   * Automatically generated on insertion
   */
  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  /**
   * Last modification date and time
   * Automatically updated on each modification
   */
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  /**
   * Validates the provided password against the stored hash
   * 
   * @param password - Plain text password to verify
   * @returns Promise<boolean> - true if password matches
   */
  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  /**
   * Returns the user's full name
   * Computed property for display
   * 
   * @returns Full name formatted as "FirstName LastName"
   */
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
