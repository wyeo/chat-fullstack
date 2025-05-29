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

  async getRoomById(roomId: string): Promise<Room> {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    return room;
  }

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

  async setUserOffline(socketId: string): Promise<void> {
    await this.onlineUserModel.deleteOne({ socketId });
  }

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

  async getOnlineUsers(): Promise<OnlineUser[]> {
    return this.onlineUserModel.find().lean().exec();
  }

  async isUserOnline(userId: string): Promise<boolean> {
    const user = await this.onlineUserModel.findOne({ userId });
    return !!user;
  }

  // ========== HELPERS ==========

  private async userHasAccessToRoom(
    userId: string,
    room: Room
  ): Promise<boolean> {
    const member = room.members.find((m) => m.userId === userId && !m.leftAt);
    return !!member;
  }
}
