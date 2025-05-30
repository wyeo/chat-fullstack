import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { defaultSchemaOptions } from './schema-config';

export type MessageDocument = Message & Document;

/**
 * Supported message types in the system
 */
export enum MessageType {
  /** Standard text message */
  TEXT = 'text',
  /** Message containing an image (not implemented) */
  IMAGE = 'image',
}

/**
 * MongoDB schema for chat messages
 * 
 * Stored in MongoDB for:
 * - High volume of messages requiring horizontal scalability
 * - Optimal write performance for real-time
 * - Flexible structure for future enriched messages
 * - Efficient aggregations for history
 * 
 * @collection messages - MongoDB messages collection
 */
@Schema({ ...defaultSchemaOptions, collection: 'messages' })
export class Message {
  /**
   * Unique message identifier (MongoDB ObjectId)
   * Automatically mapped from _id
   */
  id?: string;

  /**
   * Message text content
   * Limited to 2000 characters to prevent abuse
   * Sanitized on client side to prevent XSS
   */
  @Prop({ required: true, minlength: 1, maxlength: 2000 })
  content!: string;

  /**
   * Sender's UUID (references UserEntity in PostgreSQL)
   * Weak link to PostgreSQL database
   */
  @Prop({ required: true })
  senderId!: string;

  /**
   * Sender's username
   * Denormalized to avoid cross-database joins
   */
  @Prop()
  senderUsername?: string;

  /**
   * Sender's avatar URL
   * Denormalized for display performance
   */
  @Prop()
  senderAvatar?: string;

  /**
   * Chat room ObjectId
   * Strong reference to rooms collection
   */
  @Prop({ required: true })
  roomId!: string;

  /**
   * Message creation timestamp
   * Used to order messages chronologically
   */
  @Prop({ required: true, type: Date, default: Date.now })
  timestamp!: Date;

  /**
   * Message content type
   * Defaults to TEXT, extensible for multimedia support
   */
  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  messageType!: MessageType;

  /**
   * Edit indicator
   * true if message was edited after sending
   */
  @Prop({ default: false })
  isEdited!: boolean;

  /**
   * Last edit date
   * null if never edited
   */
  @Prop({ type: Date })
  editedAt?: Date;

  /**
   * Soft delete: deletion indicator
   * Deleted messages remain in database for audit
   */
  @Prop({ default: false })
  isDeleted!: boolean;

  /**
   * Deletion date (soft delete)
   * null if never deleted
   */
  @Prop({ type: Date })
  deletedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

/**
 * Indexing strategy to optimize queries:
 * - roomId + timestamp: Retrieve room messages in chronological order
 * - senderId: Search messages by user
 * - timestamp: Global sort of recent messages
 * - roomId + isDeleted: Filter active messages by room
 */
MessageSchema.index({ roomId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ timestamp: -1 });
MessageSchema.index({ roomId: 1, isDeleted: 1 });
