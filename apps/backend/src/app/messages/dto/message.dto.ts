import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MessageType } from '@backend/messages/schemas/message.schema';

export * from './message-response.dto';

export class CreateMessageDto {
  @ApiProperty({
    description: 'Content of the message',
    minLength: 1,
    maxLength: 2000,
    example: 'Hello everyone! How are you doing today?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiProperty({
    description: 'ID of the room/conversation where the message will be sent',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @ApiPropertyOptional({
    enum: MessageType,
    default: MessageType.TEXT,
    description: 'Type of the message content',
    example: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}

export class UpdateMessageDto {
  @ApiProperty({
    description: 'Updated content of the message',
    minLength: 1,
    maxLength: 2000,
    example: 'Updated message: Hello everyone! How are you doing today?',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export class CreateDirectRoomDto {
  @ApiProperty({
    description: 'ID of the user to start a direct conversation with',
    example: '507f1f77bcf86cd799439012',
  })
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;
}

export class AddMemberDto {
  @ApiProperty({
    description: 'ID of the user to add to the room',
    example: '507f1f77bcf86cd799439013',
  })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export class GetMessagesDto {
  @ApiPropertyOptional({
    description: 'Number of messages to retrieve (max 100)',
    default: 50,
    minimum: 1,
    maximum: 100,
    example: 20,
  })
  @IsOptional()
  @IsNumber()
  limit?: number = 50;

  @ApiPropertyOptional({
    description: 'Number of messages to skip for pagination',
    default: 0,
    minimum: 0,
    example: 0,
  })
  @IsOptional()
  @IsNumber()
  offset?: number = 0;

  @ApiPropertyOptional({
    description: 'Get messages sent before this date (ISO string)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  before?: string;
}

export class WsJoinRoomDto {
  @ApiProperty({
    description: 'ID of the room to join via WebSocket',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}

export class WsLeaveRoomDto {
  @ApiProperty({
    description: 'ID of the room to leave via WebSocket',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}

export class WsSendMessageDto {
  @ApiProperty({
    description: 'Content of the message to send via WebSocket',
    minLength: 1,
    maxLength: 2000,
    example: 'Hello from WebSocket!',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiProperty({
    description: 'ID of the room where to send the message',
    example: '507f1f77bcf86cd799439011',
  })
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @ApiPropertyOptional({
    enum: MessageType,
    default: MessageType.TEXT,
    description: 'Type of the message content',
    example: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}
