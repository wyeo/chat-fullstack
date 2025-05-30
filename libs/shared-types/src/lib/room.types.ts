import { Message } from './message.types.js';

/**
 * Supported chat room types
 * Currently limited to direct chats (1-to-1)
 */
export type RoomType = 'direct';

/**
 * Room type enum for type-safe usage
 */
export enum RoomTypeEnum {
  /** Direct chat between two users */
  DIRECT = 'direct',
  // GROUP = 'group', // Future: group rooms
}

/**
 * Possible member roles in a room
 */
export enum MemberRoleEnum {
  /** Room administrator/creator */
  ADMIN = 'admin',
  /** Standard member */
  MEMBER = 'member',
}

/**
 * Interface representing a chat room
 * 
 * Used for:
 * - User's room list
 * - Navigation between conversations
 * - Member management
 * 
 * Corresponds to Room schema in MongoDB
 */
export interface Room {
  /** Unique room identifier (MongoDB ObjectId) */
  id: string;
  
  /** Room name (concatenated usernames for DIRECT) */
  name: string;
  
  /** Room type (currently only 'direct') */
  type: RoomType;
  
  /** Creator's UUID (references User.id) */
  createdBy: string;
  
  /** List of room members */
  members: RoomMember[];
  
  /** Last room message (for preview) */
  lastMessage?: Message;
  
  /** Creation date (ISO 8601 format) */
  createdAt: string;
  
  /** Modification date (ISO 8601 format) */
  updatedAt: string;
}

/**
 * Interface representing a room member
 * 
 * Used for:
 * - Permission management
 * - Participation history
 * - Participant display
 */
export interface RoomMember {
  /** User UUID (references User.id) */
  userId: string;
  
  /** Room join date */
  joinedAt: Date;
  
  /** Leave date (null if still member) */
  leftAt?: Date;
  
  /** Role in the room */
  role: MemberRoleEnum;
}
