import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@backend/app/auth/guards/jwt-auth.guard';
import { AdminGuard } from '@backend/app/auth/guards/admin.guard';
import { MessagesService } from '@backend/messages/messages.service';

import type { RequestWithUser } from '@backend/app/auth/interfaces/request-with-user.interface';

import {
  CreateMessageDto,
  UpdateMessageDto,
  CreateDirectRoomDto,
  GetMessagesDto,
  AddMemberDto,
  MessageResponseDto,
  RoomResponseDto,
  OnlineUsersListResponseDto,
  ApiErrorResponseDto,
} from '@backend/messages/dto/message.dto';

@ApiTags('Messages & Rooms')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // ========== MESSAGES ENDPOINTS ==========

  @Post()
  @ApiOperation({
    summary: 'Send a new message',
    description:
      'Sends a new message to a specified room. User must be a member of the room.',
  })
  @ApiResponse({
    status: 201,
    description: 'Message sent successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid message data',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to room',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Sends a new message to a specified room
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @param {CreateMessageDto} createMessageDto - Message data including content and room ID
   * @returns {Promise<Message>} The created message with sender information
   */
  async createMessage(
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto
  ) {
    return this.messagesService.createMessage(req.user.id, createMessageDto);
  }

  @Get('room/:roomId')
  @ApiOperation({
    summary: 'Get messages from a room',
    description:
      'Retrieves messages from a room with pagination. Only accessible to room members.',
  })
  @ApiParam({
    name: 'roomId',
    description: 'ID of the room',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to retrieve (max 100)',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of messages to skip for pagination',
    example: 0,
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
    description: 'Get messages sent before this date (ISO string)',
    example: '2024-01-15T10:30:00.000Z',
  })
  @ApiResponse({
    status: 200,
    description: 'Messages retrieved successfully',
    type: [MessageResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - No access to room',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Retrieves messages from a room with pagination support
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @param {string} roomId - The ID of the room to fetch messages from
   * @param {GetMessagesDto} query - Query parameters for pagination and filtering
   * @returns {Promise<Message[]>} Array of messages from the room
   */
  async getMessages(
    @Request() req: RequestWithUser,
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesDto
  ) {
    return this.messagesService.getMessages(req.user.id, roomId, query);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Edit a message',
    description:
      'Updates the content of an existing message. Only the message owner can edit it.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the message to edit',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Message updated successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Cannot edit deleted message or invalid data',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not your message',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Updates an existing message (only by message owner)
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @param {string} messageId - The ID of the message to update
   * @param {UpdateMessageDto} updateMessageDto - New message content
   * @returns {Promise<Message>} The updated message with edit metadata
   */
  async updateMessage(
    @Request() req: RequestWithUser,
    @Param('id') messageId: string,
    @Body() updateMessageDto: UpdateMessageDto
  ) {
    return this.messagesService.updateMessage(
      req.user.id,
      messageId,
      updateMessageDto
    );
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a message (soft delete)',
    description:
      'Soft deletes a message. Only the message owner can delete it.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the message to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Message deleted successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not your message',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Message not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Soft deletes a message (only by message owner)
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @param {string} messageId - The ID of the message to delete
   * @returns {Promise<Message>} The soft-deleted message with deletion metadata
   */
  async deleteMessage(
    @Request() req: RequestWithUser,
    @Param('id') messageId: string
  ) {
    return this.messagesService.deleteMessage(req.user.id, messageId);
  }

  // ========== ROOMS ENDPOINTS ==========

  @Post('rooms/direct')
  @ApiOperation({
    summary: 'Create or get a direct conversation',
    description:
      'Creates a new direct conversation room or returns existing one between two users.',
  })
  @ApiResponse({
    status: 201,
    description: 'Direct room created or retrieved successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid target user ID',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Target user not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Creates or retrieves a direct conversation room between two users
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @param {CreateDirectRoomDto} createDirectRoomDto - Contains target user ID
   * @returns {Promise<Room>} The created or existing direct room
   */
  async createDirectRoom(
    @Request() req: RequestWithUser,
    @Body() createDirectRoomDto: CreateDirectRoomDto
  ) {
    return this.messagesService.createDirectRoom(
      req.user.id,
      createDirectRoomDto
    );
  }

  @Get('rooms')
  @ApiOperation({
    summary: 'Get all rooms for the current user',
    description:
      'Retrieves all active rooms where the current user is a member.',
  })
  @ApiResponse({
    status: 200,
    description: 'Rooms retrieved successfully',
    type: [RoomResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  /**
   * Retrieves all rooms that the current user is a member of
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @returns {Promise<Room[]>} Array of rooms sorted by last activity
   */
  async getUserRooms(@Request() req: RequestWithUser) {
    return this.messagesService.getUserRooms(req.user.id);
  }

  @Get('rooms/:id')
  @ApiOperation({
    summary: 'Get room details by ID',
    description: 'Retrieves detailed information about a specific room.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the room',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Room retrieved successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Retrieves detailed information about a specific room
   *
   * @param {string} roomId - The unique identifier of the room
   * @returns {Promise<Room>} The room details
   */
  async getRoomById(@Param('id') roomId: string) {
    return this.messagesService.getRoomById(roomId);
  }

  @Post('rooms/:id/members')
  @ApiOperation({
    summary: 'Add a member to a room',
    description:
      'Adds a new member to a room. Only admins and owners can add members.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the room',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Member added successfully',
    type: RoomResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - User is already a member',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Not admin or owner',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Adds a new member to a room (admin/owner only)
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @param {string} roomId - The ID of the room to add member to
   * @param {AddMemberDto} addMemberDto - Contains the user ID to add
   * @returns {Promise<Room>} The updated room with new member
   */
  async addMember(
    @Request() req: RequestWithUser,
    @Param('id') roomId: string,
    @Body() addMemberDto: AddMemberDto
  ) {
    return this.messagesService.addMemberToRoom(
      req.user.id,
      roomId,
      addMemberDto.userId
    );
  }

  @Delete('rooms/:id/leave')
  @ApiOperation({
    summary: 'Leave a room',
    description: 'Removes the current user from a room.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the room to leave',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Left room successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Left room successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Not a member of this room',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Removes the current user from a room
   *
   * @param {RequestWithUser} req - Express request containing authenticated user
   * @param {string} roomId - The ID of the room to leave
   * @returns {Promise<{message: string}>} Success confirmation message
   */
  async leaveRoom(
    @Request() req: RequestWithUser,
    @Param('id') roomId: string
  ) {
    await this.messagesService.leaveRoom(req.user.id, roomId);
    return { message: 'Left room successfully' };
  }

  @Delete('rooms/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({
    summary: 'Delete a room (Admin only)',
    description:
      'Permanently deletes a room and all its messages. Admin access required.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID of the room to delete',
    type: 'string',
    example: '507f1f77bcf86cd799439013',
  })
  @ApiResponse({
    status: 200,
    description: 'Room deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Room deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access only',
    type: ApiErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
    type: ApiErrorResponseDto,
  })
  /**
   * Permanently deletes a room and all its messages (Admin only)
   *
   * @param {string} roomId - The ID of the room to delete
   * @returns {Promise<{message: string}>} Success confirmation message
   */
  async deleteRoom(@Param('id') roomId: string) {
    await this.messagesService.deleteRoom(roomId);
    return { message: 'Room deleted successfully' };
  }

  // ========== ONLINE USERS ENDPOINTS ==========

  @Get('online-users')
  @ApiOperation({
    summary: 'Get list of online users',
    description:
      'Retrieves a list of all currently online users with their status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Online users retrieved successfully',
    type: OnlineUsersListResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ApiErrorResponseDto,
  })
  /**
   * Retrieves a list of all currently online users
   *
   * @returns {Promise<OnlineUser[]>} Array of online user records
   */
  async getOnlineUsers() {
    return this.messagesService.getOnlineUsers();
  }
}
