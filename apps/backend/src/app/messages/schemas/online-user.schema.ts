import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { defaultSchemaOptions } from './schema-config';

export type OnlineUserDocument = OnlineUser & Document;

/**
 * User presence statuses
 */
export enum UserStatus {
  /** Active and connected user */
  ONLINE = 'online',
  /** Connected but inactive user */
  AWAY = 'away',
}

/**
 * MongoDB schema for tracking online users
 * 
 * Stored in MongoDB for:
 * - Native TTL for automatic cleanup (5 minutes)
 * - Optimal performance for frequent updates
 * - Simple management of multiple connections
 * 
 * Documents automatically expire 5 minutes after lastSeen
 * to handle unclean disconnections
 * 
 * @collection online_users - Ephemeral MongoDB collection
 */
@Schema({ ...defaultSchemaOptions, collection: 'online_users' })
export class OnlineUser {
  /**
   * User UUID (references UserEntity in PostgreSQL)
   * A user can have multiple connections (multi-device)
   */
  @Prop({ required: true, min: 1 })
  userId!: string;

  /**
   * Unique Socket.io connection identifier
   * Allows targeting messages to a specific connection
   */
  @Prop({ required: true })
  socketId!: string;

  /**
   * User presence status
   * Can be extended to include 'busy', 'offline', etc.
   */
  @Prop({ type: String, enum: UserStatus, default: UserStatus.ONLINE })
  status!: UserStatus;

  /**
   * Last detected activity
   * Periodically updated to maintain presence
   * TTL index: document deleted 5 min after this date
   */
  @Prop({ required: true, type: Date, default: Date.now })
  lastSeen!: Date;
}

export const OnlineUserSchema = SchemaFactory.createForClass(OnlineUser);

/**
 * Indexing strategy to optimize queries:
 * - userId (unique): One entry per user
 * - socketId (unique): Fast lookup by connection
 * - status: Filter by presence status
 * - lastSeen (TTL): Auto-deletion after 5 minutes of inactivity
 */
OnlineUserSchema.index({ userId: 1 }, { unique: true });
OnlineUserSchema.index({ socketId: 1 }, { unique: true });
OnlineUserSchema.index({ status: 1 });
OnlineUserSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 });
