/**
 * Interface representing a user in the application
 * 
 * Used for:
 * - API responses (without sensitive information like password)
 * - Frontend type safety
 * - Inter-module communication
 * 
 * Corresponds to UserEntity in PostgreSQL
 */
export interface User {
  /** Unique user identifier (UUID) */
  id: string;
  
  /** Unique email address (used for authentication) */
  email: string;
  
  /** User's first name */
  firstName: string;
  
  /** User's last name */
  lastName: string;
  
  /** Account creation date (ISO 8601 format) */
  createdAt: string;
  
  /** Last modification date (ISO 8601 format) */
  updatedAt: string;
  
  /** Account activation status (true = active, false = suspended) */
  isActive?: boolean;
  
  /** Administrator privileges (true = admin, false = standard user) */
  isAdmin?: boolean;
}

/**
 * Interface representing a real-time connected user
 * 
 * Used for:
 * - Tracking active WebSocket connections
 * - Displaying online users
 * - Presence management
 * 
 * Corresponds to OnlineUser schema in MongoDB
 */
export interface OnlineUser {
  /** User UUID (references User.id) */
  userId: string;
  
  /** Unique Socket.io connection identifier */
  socketId: string;
  
  /** Connection date/time */
  connectedAt: Date;
}