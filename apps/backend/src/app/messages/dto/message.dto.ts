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

export class CreateMessageDto {
  @ApiProperty({
    description: 'Content of the message',
    minLength: 1,
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @ApiProperty({ description: 'ID of the room/conversation' })
  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}

export class UpdateMessageDto {
  @ApiProperty({ description: 'Updated content of the message' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}

export class CreateDirectRoomDto {
  @ApiProperty({ description: 'ID of the user to start conversation with' })
  @IsString()
  @IsNotEmpty()
  targetUserId!: string;
}

export class AddMemberDto {
  @ApiProperty({ description: 'ID of the user to add' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}

export class GetMessagesDto {
  @ApiPropertyOptional({
    description: 'Number of messages to retrieve',
    default: 50,
  })
  @IsOptional()
  @IsNumber()
  limit?: number = 50;

  @ApiPropertyOptional({ description: 'Offset for pagination' })
  @IsOptional()
  @IsNumber()
  offset?: number = 0;

  @ApiPropertyOptional({ description: 'Get messages before this date' })
  @IsOptional()
  @IsDateString()
  before?: string;
}

export class WsJoinRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}

export class WsLeaveRoomDto {
  @IsString()
  @IsNotEmpty()
  roomId!: string;
}

export class WsSendMessageDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;

  @IsString()
  @IsNotEmpty()
  roomId!: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}
