import { User } from './user.types.js';

/**
 * Required credentials for login
 * 
 * Used for:
 * - POST /auth/login request
 * - Frontend validation
 */
export interface LoginCredentials {
  /** User email address */
  email: string;
  
  /** Plain text password (will be hashed server-side) */
  password: string;
}

/**
 * Required information for registration
 * 
 * Used for:
 * - POST /auth/register request
 * - Creating a new user account
 * 
 * Validation constraints:
 * - Email: valid format and unique
 * - Password: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special
 * - firstName/lastName: 2-50 characters
 */
export interface RegisterCredentials {
  /** Unique email address */
  email: string;
  
  /** Secure password (will be hashed with bcrypt) */
  password: string;
  
  /** User's first name */
  firstName: string;
  
  /** User's last name */
  lastName: string;
}

/**
 * Successful authentication response
 * 
 * Returned by:
 * - POST /auth/login
 * - POST /auth/register
 * - POST /auth/refresh
 * 
 * The JWT token contains the user ID and expires after 24h
 */
export interface AuthResponse {
  /** JWT token to authenticate future requests */
  accessToken: string;
  
  /** Public information of the logged-in user */
  user: User;
}