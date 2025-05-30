import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { defaultSchemaOptions } from './schema-config';

export type RoomDocument = Room & Document;

/**
 * Supported chat room types
 */
export enum RoomType {
  /** Direct chat between two users */
  DIRECT = 'direct',
  // GROUP = 'group', // Future: group rooms
}

/**
 * Member roles within a room
 */
export enum MemberRole {
  /** Room administrator (creator) */
  ADMIN = 'admin',
  /** Standard member */
  MEMBER = 'member',
}

/**
 * Embedded schema for room members
 * Stored as subdocument to avoid joins
 */
@Schema({ ...defaultSchemaOptions })
export class RoomMember {
  /**
   * User UUID (references UserEntity in PostgreSQL)
   */
  @Prop({ required: true })
  userId!: string;

  /**
   * Member's role in the room
   * ADMIN for creator, MEMBER for others
   */
  @Prop({ type: String, enum: MemberRole, default: MemberRole.MEMBER })
  role!: MemberRole;

  /**
   * Room join date
   */
  @Prop({ required: true, type: Date, default: Date.now })
  joinedAt!: Date;

  /**
   * Room leave date (null if still member)
   * Used for history and statistics
   */
  @Prop({ type: Date })
  leftAt?: Date;
}

/**
 * MongoDB schema for chat rooms
 * 
 * Stored in MongoDB for:
 * - Flexible member management (embedded array)
 * - Optimal performance for real-time operations
 * - Easy extension for future group rooms
 * 
 * @collection rooms - MongoDB rooms collection
 */
@Schema({ ...defaultSchemaOptions, collection: 'rooms' })
export class Room {
  /**
   * Unique room identifier (MongoDB ObjectId)
   * Automatically mapped from _id
   */
  id?: string;

  /**
   * Room name
   * For DIRECT: concatenated usernames
   * For GROUP (future): customizable name
   */
  @Prop({ required: true, minlength: 1, maxlength: 100 })
  name!: string;

  /**
   * Room type (currently only DIRECT)
   */
  @Prop({ required: true, type: String, enum: RoomType })
  type!: RoomType;

  /**
   * Optional room description
   * Mainly used for future group rooms
   */
  @Prop({ maxlength: 500 })
  description?: string;

  /**
   * Room creator's UUID
   * References UserEntity in PostgreSQL
   */
  @Prop({ required: true })
  createdBy!: string;

  /**
   * List of room members
   * Embedded array for performance and atomicity
   * For DIRECT: exactly 2 members
   */
  @Prop({ type: [RoomMember], default: [] })
  members!: RoomMember[];

  /**
   * Room activity status
   * false = archived/deleted room (soft delete)
   */
  @Prop({ default: true })
  isActive!: boolean;

  /**
   * Last activity date (last message)
   * Used to sort rooms by recent activity
   */
  @Prop({ type: Date })
  lastActivity?: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

/**
 * Indexing strategy to optimize queries:
 * - type: Filter by room type
 * - members.userId: Search user's rooms
 * - createdBy: Search rooms created by a user
 * - isActive: Filter active rooms
 * - lastActivity: Sort by recent activity
 */
RoomSchema.index({ type: 1 });
RoomSchema.index({ 'members.userId': 1 });
RoomSchema.index({ createdBy: 1 });
RoomSchema.index({ isActive: 1 });
RoomSchema.index({ lastActivity: -1 });
