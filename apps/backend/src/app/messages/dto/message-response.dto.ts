import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { MessageType } from '@backend/messages/schemas/message.schema';
import { UserStatus } from '@backend/messages/schemas/online-user.schema';
import { RoomType, MemberRole } from '@backend/messages/schemas/room.schema';

export class MessageResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439011',
    description: 'Unique message identifier',
  })
  _id!: string;

  @ApiProperty({
    example: 'Hello everyone! How are you doing today?',
    description: 'Message content',
  })
  content!: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'ID of the user who sent the message',
  })
  senderId!: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Sender full name',
  })
  senderUsername!: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439013',
    description: 'Room/conversation ID',
  })
  roomId!: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Message send date and time',
    format: 'date-time',
  })
  timestamp!: Date;

  @ApiProperty({
    enum: MessageType,
    example: MessageType.TEXT,
    description: 'Message type',
  })
  messageType!: MessageType;

  @ApiProperty({
    example: false,
    description: 'Indicates if the message has been edited',
  })
  isEdited!: boolean;

  @ApiPropertyOptional({
    example: '2024-01-15T10:35:00.000Z',
    description: 'Last edit date (if applicable)',
    format: 'date-time',
  })
  editedAt?: Date;

  @ApiProperty({
    example: false,
    description: 'Indicates if the message has been deleted (soft delete)',
  })
  isDeleted!: boolean;

  @ApiPropertyOptional({
    example: '2024-01-15T10:40:00.000Z',
    description: 'Deletion date (if applicable)',
    format: 'date-time',
  })
  deletedAt?: Date;
}

export class RoomMemberDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Member user ID',
  })
  userId!: string;

  @ApiProperty({
    enum: MemberRole,
    example: MemberRole.MEMBER,
    description: 'Member role in the room',
  })
  role!: MemberRole;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Date added to the room',
    format: 'date-time',
  })
  joinedAt!: Date;

  @ApiPropertyOptional({
    example: '2024-01-20T15:00:00.000Z',
    description: 'Date left the room (if applicable)',
    format: 'date-time',
  })
  leftAt?: Date;
}

export class RoomResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439013',
    description: 'Unique room identifier',
  })
  _id!: string;

  @ApiProperty({
    example: 'John & Jane',
    description: 'Room/conversation name',
  })
  name!: string;

  @ApiProperty({
    enum: RoomType,
    example: RoomType.DIRECT,
    description: 'Room type',
  })
  type!: RoomType;

  @ApiPropertyOptional({
    example: 'Private discussion between John and Jane',
    description: 'Room description',
  })
  description?: string;

  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'ID of the user who created the room',
  })
  createdBy!: string;

  @ApiProperty({
    type: [RoomMemberDto],
    description: 'List of members with their roles',
  })
  members!: RoomMemberDto[];

  @ApiProperty({
    example: true,
    description: 'Indicates if the room is active',
  })
  isActive!: boolean;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last activity in the room',
    format: 'date-time',
  })
  lastActivity!: Date;

  @ApiProperty({
    example: '2024-01-15T10:00:00.000Z',
    description: 'Room creation date',
    format: 'date-time',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Last update date',
    format: 'date-time',
  })
  updatedAt!: Date;
}

export class OnlineUserResponseDto {
  @ApiProperty({
    example: '507f1f77bcf86cd799439012',
    description: 'Online user ID',
  })
  userId!: string;

  @ApiProperty({
    example: 'socket_abc123',
    description: 'WebSocket connection ID',
  })
  socketId!: string;

  @ApiProperty({
    enum: UserStatus,
    example: UserStatus.ONLINE,
    description: 'User status',
  })
  status!: UserStatus;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'User last activity',
    format: 'date-time',
  })
  lastSeen!: Date;
}

export class MessagesListResponseDto {
  @ApiProperty({
    type: [MessageResponseDto],
    description: 'List of messages',
  })
  messages!: MessageResponseDto[];

  @ApiProperty({
    example: 25,
    description: 'Total number of messages in the response',
  })
  count!: number;

  @ApiProperty({
    example: 0,
    description: 'Offset applied for pagination',
  })
  offset!: number;

  @ApiProperty({
    example: 50,
    description: 'Limit applied for pagination',
  })
  limit!: number;
}

export class OnlineUsersListResponseDto {
  @ApiProperty({
    type: [OnlineUserResponseDto],
    description: 'List of online users',
  })
  onlineUsers!: OnlineUserResponseDto[];

  @ApiProperty({
    example: 5,
    description: 'Number of users currently online',
  })
  count!: number;
}

export class ApiErrorResponseDto {
  @ApiProperty({
    example: 404,
    description: 'HTTP error status code',
  })
  statusCode!: number;

  @ApiProperty({
    example: 'Room not found',
    description: 'Error message',
  })
  message!: string;

  @ApiProperty({
    example: 'Not Found',
    description: 'HTTP error type',
  })
  error!: string;

  @ApiProperty({
    example: '2024-01-15T10:30:00.000Z',
    description: 'Error timestamp',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    example: '/api/messages/rooms/invalid-id',
    description: 'Request path that caused the error',
  })
  path!: string;
}