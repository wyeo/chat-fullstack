import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { defaultSchemaOptions } from './schema-config';

export type OnlineUserDocument = OnlineUser & Document;

export enum UserStatus {
  ONLINE = 'online',
  AWAY = 'away',
}

@Schema({ ...defaultSchemaOptions, collection: 'online_users' })
export class OnlineUser {
  @Prop({ required: true, min: 1 })
  userId!: string;

  @Prop({ required: true })
  socketId!: string;

  @Prop({ type: String, enum: UserStatus, default: UserStatus.ONLINE })
  status!: UserStatus;

  @Prop({ required: true, type: Date, default: Date.now })
  lastSeen!: Date;
}

export const OnlineUserSchema = SchemaFactory.createForClass(OnlineUser);

OnlineUserSchema.index({ userId: 1 }, { unique: true });
OnlineUserSchema.index({ socketId: 1 }, { unique: true });
OnlineUserSchema.index({ status: 1 });
OnlineUserSchema.index({ lastSeen: 1 }, { expireAfterSeconds: 300 });
