/**
 * Supported message types in the system
 */
export type MessageType = 'text' | 'image';

/**
 * Message type enum for type-safe usage
 */
export enum MessageTypeEnum {
  /** Standard text message */
  TEXT = 'text',
  /** Message containing an image (not implemented) */
  IMAGE = 'image',
}

/**
 * Interface representing a chat message
 * 
 * Used for:
 * - Real-time WebSocket communication
 * - Frontend message display
 * - API responses for history
 * 
 * Corresponds to Message schema in MongoDB
 * Note: Simplified version without isEdited/isDeleted fields
 */
export interface Message {
  /** Unique message identifier (MongoDB ObjectId) */
  id: string;
  
  /** Message text content (max 2000 characters) */
  content: string;
  
  /** Message content type */
  messageType: MessageType;
  
  /** Sender's UUID (references User.id) */
  senderId: string;
  
  /** Chat room ObjectId */
  roomId: string;
  
  /** Creation date (ISO 8601 format) */
  createdAt: string;
  
  /** Modification date (ISO 8601 format) */
  updatedAt: string;
  
  /** Sender's username (denormalized for performance) */
  senderUsername: string;
}
