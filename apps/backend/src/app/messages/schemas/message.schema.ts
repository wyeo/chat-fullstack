import { Document } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { defaultSchemaOptions } from './schema-config';

export type MessageDocument = Message & Document;

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
}

@Schema({ ...defaultSchemaOptions, collection: 'messages' })
export class Message {
  id?: string;

  @Prop({ required: true, minlength: 1, maxlength: 2000 })
  content!: string;

  @Prop({ required: true })
  senderId!: string;

  @Prop()
  senderUsername?: string;

  @Prop()
  senderAvatar?: string;

  @Prop({ required: true })
  roomId!: string;

  @Prop({ required: true, type: Date, default: Date.now })
  timestamp!: Date;

  @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
  messageType!: MessageType;

  @Prop({ default: false })
  isEdited!: boolean;

  @Prop({ type: Date })
  editedAt?: Date;

  @Prop({ default: false })
  isDeleted!: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);

MessageSchema.index({ roomId: 1, timestamp: -1 });
MessageSchema.index({ senderId: 1 });
MessageSchema.index({ timestamp: -1 });
MessageSchema.index({ roomId: 1, isDeleted: 1 });
