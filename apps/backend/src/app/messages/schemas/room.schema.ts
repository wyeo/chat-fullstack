import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { defaultSchemaOptions } from './schema-config';

export type RoomDocument = Room & Document;

export enum RoomType {
  DIRECT = 'direct',
}

export enum MemberRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Schema({ ...defaultSchemaOptions })
export class RoomMember {
  @Prop({ required: true })
  userId!: string;

  @Prop({ type: String, enum: MemberRole, default: MemberRole.MEMBER })
  role!: MemberRole;

  @Prop({ required: true, type: Date, default: Date.now })
  joinedAt!: Date;

  @Prop({ type: Date })
  leftAt?: Date;
}

@Schema({ ...defaultSchemaOptions, collection: 'rooms' })
export class Room {
  id?: string;

  @Prop({ required: true, minlength: 1, maxlength: 100 })
  name!: string;

  @Prop({ required: true, type: String, enum: RoomType })
  type!: RoomType;

  @Prop({ maxlength: 500 })
  description?: string;

  @Prop({ required: true })
  createdBy!: string;

  @Prop({ type: [RoomMember], default: [] })
  members!: RoomMember[];

  @Prop({ default: true })
  isActive!: boolean;

  @Prop({ type: Date })
  lastActivity?: Date;
}

export const RoomSchema = SchemaFactory.createForClass(Room);

RoomSchema.index({ type: 1 });
RoomSchema.index({ 'members.userId': 1 });
RoomSchema.index({ createdBy: 1 });
RoomSchema.index({ isActive: 1 });
RoomSchema.index({ lastActivity: -1 });
