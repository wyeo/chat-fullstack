import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';

import {
  GetMessagesDto,
  CreateMessageDto,
  UpdateMessageDto,
  CreateDirectRoomDto,
} from '@backend/messages/dto/message.dto';

import { UsersService } from '@backend/users/users.service';
import {
  Room,
  RoomType,
  MemberRole,
} from '@backend/messages/schemas/room.schema';
import {
  OnlineUser,
  UserStatus,
} from '@backend/messages/schemas/online-user.schema';
import { Message } from '@backend/messages/schemas/message.schema';

@Injectable()
export class MessagesService {
  constructor(
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(Message.name) private messageModel: Model<Message>,
    @InjectModel(OnlineUser.name) private onlineUserModel: Model<OnlineUser>,
    private usersService: UsersService
  ) {}

  // ========== MESSAGES ==========

  /**
   * Creates a new message in a room after validating user access
   * 
   * @param {string} userId - The ID of the user sending the message
   * @param {CreateMessageDto} createMessageDto - Message data including content and room ID
   * @returns {Promise<Message>} The created message with sender information
   * @throws {NotFoundException} When the specified room is not found
   * @throws {ForbiddenException} When user doesn't have access to the room
   */
  async createMessage(
    userId: string,
    createMessageDto: CreateMessageDto
  ): Promise<Message> {
    const room = await this.getRoomById(createMessageDto.roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const hasAccess = await this.userHasAccessToRoom(userId, room);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this room');
    }

    const user = await this.usersService.findOne(userId);

    const message = new this.messageModel({
      ...createMessageDto,
      senderId: userId,
      senderUsername: `${user.firstName} ${user.lastName}`,
      timestamp: new Date(),
    });

    const savedMessage = await message.save();

    await this.roomModel.findByIdAndUpdate(createMessageDto.roomId, {
      lastActivity: new Date(),
    });

    return savedMessage.toObject();
  }

  /**
   * Retrieves messages from a room with pagination and access control
   * 
   * @param {string} userId - The ID of the user requesting messages
   * @param {string} roomId - The ID of the room to fetch messages from
   * @param {GetMessagesDto} query - Query parameters for pagination and filtering
   * @returns {Promise<Message[]>} Array of messages sorted by timestamp (newest first)
   * @throws {NotFoundException} When the specified room is not found
   * @throws {ForbiddenException} When user doesn't have access to the room
   */
  async getMessages(userId: string, roomId: string, query: GetMessagesDto) {
    const room = await this.getRoomById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const hasAccess = await this.userHasAccessToRoom(userId, room);

    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this room');
    }

    const filter = { roomId, isDeleted: false, timestamp: { $lt: new Date() } };

    if (query.before) {
      filter.timestamp = { $lt: new Date(query.before) };
    }

    const messages = await this.messageModel
      .find(filter)
      .sort({ timestamp: -1 })
      .limit(query.limit || 50)
      .skip(query.offset || 0)
      .lean()
      .exec();

    return messages;
  }

  /**
   * Updates an existing message content with ownership validation
   * 
   * @param {string} userId - The ID of the user attempting to update the message
   * @param {string} messageId - The ID of the message to update
   * @param {UpdateMessageDto} updateMessageDto - New message content
   * @returns {Promise<Message>} The updated message with edit metadata
   * @throws {NotFoundException} When the message is not found
   * @throws {ForbiddenException} When user is not the message owner
   * @throws {BadRequestException} When trying to edit a deleted message
   */
  async updateMessage(
    userId: string,
    messageId: string,
    updateMessageDto: UpdateMessageDto
  ): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new BadRequestException('Cannot edit deleted message');
    }

    message.content = updateMessageDto.content;
    message.isEdited = true;
    message.editedAt = new Date();

    const updatedMessage = await message.save();
    return updatedMessage.toObject();
  }

  /**
   * Soft deletes a message with ownership validation
   * 
   * @param {string} userId - The ID of the user attempting to delete the message
   * @param {string} messageId - The ID of the message to delete
   * @returns {Promise<Message>} The soft-deleted message with deletion metadata
   * @throws {NotFoundException} When the message is not found
   * @throws {ForbiddenException} When user is not the message owner
   */
  async deleteMessage(userId: string, messageId: string): Promise<Message> {
    const message = await this.messageModel.findById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.senderId !== userId) {
      throw new ForbiddenException('You can only delete your own messages');
    }

    message.isDeleted = true;
    message.deletedAt = new Date();

    const deletedMessage = await message.save();
    return deletedMessage.toObject();
  }

  // ========== ROOMS ==========

  /**
   * Creates or retrieves a direct conversation room between two users
   * 
   * @param {string} userId - The ID of the user creating the room
   * @param {CreateDirectRoomDto} createDirectRoomDto - Contains target user ID for the conversation
   * @returns {Promise<Room>} The created or existing direct room
   * @throws {NotFoundException} When the target user is not found
   */
  async createDirectRoom(
    userId: string,
    createDirectRoomDto: CreateDirectRoomDto
  ): Promise<Room> {
    const { targetUserId } = createDirectRoomDto;

    await this.usersService.findOne(targetUserId);

    const existingRoom = await this.roomModel.findOne({
      type: RoomType.DIRECT,
      $and: [{ 'members.userId': userId }, { 'members.userId': targetUserId }],
    });

    if (existingRoom) {
      return existingRoom.toObject();
    }

    const user = await this.usersService.findOne(userId);
    const targetUser = await this.usersService.findOne(targetUserId);

    const room = new this.roomModel({
      name: `${user.firstName} & ${targetUser.firstName}`,
      type: RoomType.DIRECT,
      createdBy: userId,
      members: [
        {
          userId,
          role: MemberRole.ADMIN,
          joinedAt: new Date(),
        },
        {
          userId: targetUserId,
          role: MemberRole.MEMBER,
          joinedAt: new Date(),
        },
      ],
      lastActivity: new Date(),
    });

    const savedRoom = await room.save();
    return savedRoom.toObject();
  }

  /**
   * Retrieves all active rooms that a user is a member of
   * 
   * @param {string} userId - The ID of the user to get rooms for
   * @returns {Promise<Room[]>} Array of rooms sorted by last activity (most recent first)
   */
  async getUserRooms(userId: string) {
    const rooms = await this.roomModel
      .find({
        'members.userId': userId,
        'members.leftAt': { $exists: false },
        isActive: true,
      })
      .sort({ lastActivity: -1 })
      .exec();

    return rooms;
  }

  /**
   * Retrieves a room by its unique ID
   * 
   * @param {string} roomId - The unique identifier of the room
   * @returns {Promise<Room>} The room entity
   * @throws {NotFoundException} When the room is not found
   */
  async getRoomById(roomId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

  /**
   * Adds a new member to a room with permission validation
   * 
   * @param {string} userId - The ID of the user adding the member (must be admin/owner)
   * @param {string} roomId - The ID of the room to add member to
   * @param {string} memberId - The ID of the user to add as member
   * @returns {Promise<Room>} The updated room with new member
   * @throws {NotFoundException} When the room is not found
   * @throws {ForbiddenException} When user lacks permission to add members
   * @throws {BadRequestException} When user is already an active member
   */
  async addMemberToRoom(
    userId: string,
    roomId: string,
    memberId: string
  ): Promise<Room> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const userMember = room.members.find((m) => m.userId === userId);
    if (!userMember || !['owner', 'admin'].includes(userMember.role)) {
      throw new ForbiddenException(
        'Only room owners and admins can add members'
      );
    }

    const existingMember = room.members.find((m) => m.userId === memberId);
    if (existingMember && !existingMember.leftAt) {
      throw new BadRequestException('User is already a member of this room');
    }

    if (existingMember) {
      existingMember.leftAt = undefined;
      existingMember.joinedAt = new Date();
    } else {
      room.members.push({
        userId: memberId,
        joinedAt: new Date(),
        role: MemberRole.MEMBER,
      });
    }

    const updatedRoom = await room.save();

    return updatedRoom;
  }

  /**
   * Removes a user from a room by marking their leave date
   * 
   * @param {string} userId - The ID of the user leaving the room
   * @param {string} roomId - The ID of the room to leave
   * @returns {Promise<void>} Promise that resolves when user has left
   * @throws {NotFoundException} When the room is not found
   * @throws {BadRequestException} When user is not a member of the room
   */
  async leaveRoom(userId: string, roomId: string): Promise<void> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    const member = room.members.find((m) => m.userId === userId);
    if (!member) {
      throw new BadRequestException('You are not a member of this room');
    }

    member.leftAt = new Date();
    await room.save();
  }

  /**
   * Deactivates a room and removes all its messages (Admin only operation)
   * 
   * @param {string} roomId - The ID of the room to delete
   * @returns {Promise<void>} Promise that resolves when room is deleted
   * @throws {NotFoundException} When the room is not found
   */
  async deleteRoom(roomId: string): Promise<void> {
    const room = await this.roomModel.findById(roomId);
    if (!room) {
      throw new NotFoundException('Room not found');
    }

    room.isActive = false;
    await room.save();

    await this.messageModel.deleteMany({ roomId });
  }

  // ========== ONLINE USERS ==========

  /**
   * Marks a user as online and associates them with a WebSocket connection
   * 
   * @param {string} userId - The ID of the user to mark online
   * @param {string} socketId - The WebSocket connection ID
   * @returns {Promise<OnlineUser | null>} The online user record or null
   */
  async setUserOnline(
    userId: string,
    socketId: string
  ): Promise<OnlineUser | null> {
    const onlineUser = await this.onlineUserModel.findOneAndUpdate(
      { userId },
      {
        userId,
        socketId,
        lastSeen: new Date(),
        status: UserStatus.ONLINE,
      },
      { upsert: true, new: true, lean: true }
    );

    return onlineUser;
  }

  /**
   * Removes a user from online status by their WebSocket connection ID
   * 
   * @param {string} socketId - The WebSocket connection ID to remove
   * @returns {Promise<void>} Promise that resolves when user is marked offline
   */
  async setUserOffline(socketId: string): Promise<void> {
    await this.onlineUserModel.deleteOne({ socketId });
  }

  /**
   * Updates a user's online status (online, away, etc.)
   * 
   * @param {string} userId - The ID of the user to update
   * @param {UserStatus} status - The new status to set
   * @returns {Promise<OnlineUser | null>} The updated online user record or null
   */
  async updateUserStatus(
    userId: string,
    status: UserStatus
  ): Promise<OnlineUser | null> {
    return this.onlineUserModel.findOneAndUpdate(
      { userId },
      { status, lastSeen: new Date() },
      { new: true, lean: true }
    );
  }

  /**
   * Retrieves all currently online users
   * 
   * @returns {Promise<OnlineUser[]>} Array of all online user records
   */
  async getOnlineUsers(): Promise<OnlineUser[]> {
    return this.onlineUserModel.find().lean().exec();
  }

  /**
   * Checks if a specific user is currently online
   * 
   * @param {string} userId - The ID of the user to check
   * @returns {Promise<boolean>} True if user is online, false otherwise
   */
  async isUserOnline(userId: string): Promise<boolean> {
    const user = await this.onlineUserModel.findOne({ userId });
    return !!user;
  }

  // ========== HELPERS ==========

  /**
   * Checks if a user has access to a specific room
   * 
   * @private
   * @param {string} userId - The ID of the user to check
   * @param {Room} room - The room to check access for
   * @returns {Promise<boolean>} True if user has access, false otherwise
   */
  private async userHasAccessToRoom(
    userId: string,
    room: Room
  ): Promise<boolean> {
    const member = room.members.find((m) => m.userId === userId && !m.leftAt);
    return !!member;
  }
}
