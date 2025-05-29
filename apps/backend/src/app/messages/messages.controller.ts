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
} from '@backend/messages/dto/message.dto';

@ApiTags('messages')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('messages')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // ========== MESSAGES ENDPOINTS ==========

  @Post()
  @ApiOperation({ summary: 'Send a new message' })
  @ApiResponse({ status: 201, description: 'Message sent successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to room' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async createMessage(
    @Request() req: RequestWithUser,
    @Body() createMessageDto: CreateMessageDto
  ) {
    return this.messagesService.createMessage(req.user.id, createMessageDto);
  }

  @Get('room/:roomId')
  @ApiOperation({ summary: 'Get messages from a room' })
  @ApiParam({ name: 'roomId', description: 'ID of the room' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of messages to retrieve',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination',
  })
  @ApiQuery({
    name: 'before',
    required: false,
    type: String,
    description: 'Get messages before this date',
  })
  @ApiResponse({ status: 200, description: 'Messages retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - No access to room' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getMessages(
    @Request() req: RequestWithUser,
    @Param('roomId') roomId: string,
    @Query() query: GetMessagesDto
  ) {
    return this.messagesService.getMessages(req.user.id, roomId, query);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit a message' })
  @ApiParam({ name: 'id', description: 'ID of the message' })
  @ApiResponse({ status: 200, description: 'Message updated successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
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
  @ApiOperation({ summary: 'Delete a message (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID of the message' })
  @ApiResponse({ status: 200, description: 'Message deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not your message' })
  @ApiResponse({ status: 404, description: 'Message not found' })
  async deleteMessage(
    @Request() req: RequestWithUser,
    @Param('id') messageId: string
  ) {
    return this.messagesService.deleteMessage(req.user.id, messageId);
  }

  // ========== ROOMS ENDPOINTS ==========

  @Post('rooms/direct')
  @ApiOperation({ summary: 'Create or get a direct conversation' })
  @ApiResponse({
    status: 201,
    description: 'Direct room created or retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Target user not found' })
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
  @ApiOperation({ summary: 'Get all rooms for the current user' })
  @ApiResponse({ status: 200, description: 'Rooms retrieved successfully' })
  async getUserRooms(@Request() req: RequestWithUser) {
    return this.messagesService.getUserRooms(req.user.id);
  }

  @Get('rooms/:id')
  @ApiOperation({ summary: 'Get room details by ID' })
  @ApiParam({ name: 'id', description: 'ID of the room' })
  @ApiResponse({ status: 200, description: 'Room retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async getRoomById(@Param('id') roomId: string) {
    return this.messagesService.getRoomById(roomId);
  }

  @Post('rooms/:id/members')
  @ApiOperation({ summary: 'Add a member to a room' })
  @ApiParam({ name: 'id', description: 'ID of the room' })
  @ApiResponse({ status: 200, description: 'Member added successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not admin or owner' })
  @ApiResponse({ status: 404, description: 'Room not found' })
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
  @ApiOperation({ summary: 'Leave a room' })
  @ApiParam({ name: 'id', description: 'ID of the room' })
  @ApiResponse({ status: 200, description: 'Left room successfully' })
  @ApiResponse({ status: 400, description: 'Not a member of this room' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  async leaveRoom(
    @Request() req: RequestWithUser,
    @Param('id') roomId: string
  ) {
    await this.messagesService.leaveRoom(req.user.id, roomId);
    return { message: 'Left room successfully' };
  }

  @Delete('rooms/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Delete a room (Admin only)' })
  @ApiParam({ name: 'id', description: 'ID of the room', type: 'string' })
  @ApiResponse({
    status: 200,
    description: 'Room deleted successfully',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access only',
  })
  @ApiResponse({
    status: 404,
    description: 'Room not found',
  })
  async deleteRoom(@Param('id') roomId: string) {
    await this.messagesService.deleteRoom(roomId);
    return { message: 'Room deleted successfully' };
  }

  // ========== ONLINE USERS ENDPOINTS ==========

  @Get('online-users')
  @ApiOperation({ summary: 'Get list of online users' })
  @ApiResponse({
    status: 200,
    description: 'Online users retrieved successfully',
  })
  async getOnlineUsers() {
    return this.messagesService.getOnlineUsers();
  }
}
