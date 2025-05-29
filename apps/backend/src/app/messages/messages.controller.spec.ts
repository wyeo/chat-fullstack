import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

import {
  AddMemberDto,
  GetMessagesDto,
  CreateMessageDto,
  UpdateMessageDto,
  CreateDirectRoomDto,
} from '@backend/messages/dto/message.dto';
import { AdminGuard } from '@backend/auth/guards/admin.guard';
import { JwtAuthGuard } from '@backend/auth/guards/jwt-auth.guard';
import { MessagesService } from '@backend/messages/messages.service';
import { MessageType } from '@backend/messages/schemas/message.schema';
import { UserStatus } from '@backend/messages/schemas/online-user.schema';
import { MessagesController } from '@backend/messages/messages.controller';
import { RoomType, MemberRole } from '@backend/messages/schemas/room.schema';
import type { RequestWithUser } from '@backend/auth/interfaces/request-with-user.interface';

describe('MessagesController', () => {
  let controller: MessagesController;
  let service: MessagesService;

  const mockUser = {
    id: 'user123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    password: 'hashedPassword',
    isActive: true,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    async validatePassword(password: string): Promise<boolean> {
      return password === 'validPassword';
    },
    get fullName(): string {
      return `${this.firstName} ${this.lastName}`;
    },
  };

  const mockRequest = {
    user: mockUser,
  } as RequestWithUser;

  const mockMessage = {
    id: 'message123',
    content: 'Test message',
    senderId: 'user123',
    senderUsername: 'Test User',
    roomId: 'room123',
    timestamp: new Date(),
    messageType: MessageType.TEXT,
    isEdited: false,
    isDeleted: false,
  };

  const mockRoom = {
    id: 'room123',
    name: 'Test Room',
    type: RoomType.DIRECT,
    createdBy: 'user123',
    members: [
      {
        userId: 'user123',
        role: MemberRole.ADMIN,
        joinedAt: new Date(),
      },
      {
        userId: 'user456',
        role: MemberRole.MEMBER,
        joinedAt: new Date(),
      },
    ],
    isActive: true,
    lastActivity: new Date(),
  };

  const mockOnlineUsers = [
    {
      userId: 'user123',
      socketId: 'socket123',
      status: UserStatus.ONLINE,
      lastSeen: new Date(),
    },
    {
      userId: 'user456',
      socketId: 'socket456',
      status: UserStatus.AWAY,
      lastSeen: new Date(),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MessagesController],
      providers: [
        {
          provide: MessagesService,
          useValue: {
            createMessage: jest.fn(),
            getMessages: jest.fn(),
            updateMessage: jest.fn(),
            deleteMessage: jest.fn(),
            createDirectRoom: jest.fn(),
            getUserRooms: jest.fn(),
            getRoomById: jest.fn(),
            addMemberToRoom: jest.fn(),
            leaveRoom: jest.fn(),
            deleteRoom: jest.fn(),
            getOnlineUsers: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(AdminGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MessagesController>(MessagesController);
    service = module.get<MessagesService>(MessagesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Message Endpoints', () => {
    describe('POST /messages', () => {
      it('should create a message successfully', async () => {
        const createMessageDto: CreateMessageDto = {
          content: 'Test message',
          roomId: 'room123',
          messageType: MessageType.TEXT,
        };

        jest.spyOn(service, 'createMessage').mockResolvedValue(mockMessage);

        const result = await controller.createMessage(
          mockRequest,
          createMessageDto
        );

        expect(service.createMessage).toHaveBeenCalledWith(
          'user123',
          createMessageDto
        );
        expect(result).toEqual(mockMessage);
      });

      it('should handle room not found error', async () => {
        const createMessageDto: CreateMessageDto = {
          content: 'Test message',
          roomId: 'nonexistent',
          messageType: MessageType.TEXT,
        };

        jest
          .spyOn(service, 'createMessage')
          .mockRejectedValue(new NotFoundException('Room not found'));

        await expect(
          controller.createMessage(mockRequest, createMessageDto)
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle forbidden access error', async () => {
        const createMessageDto: CreateMessageDto = {
          content: 'Test message',
          roomId: 'room123',
          messageType: MessageType.TEXT,
        };

        jest
          .spyOn(service, 'createMessage')
          .mockRejectedValue(
            new ForbiddenException('You do not have access to this room')
          );

        await expect(
          controller.createMessage(mockRequest, createMessageDto)
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('GET /messages/room/:roomId', () => {
      it('should get messages with default query', async () => {
        const mockMessages = [mockMessage];
        const query: GetMessagesDto = {};

        jest
          .spyOn(service, 'getMessages')
          .mockResolvedValue(mockMessages as never);

        const result = await controller.getMessages(
          mockRequest,
          'room123',
          query
        );

        expect(service.getMessages).toHaveBeenCalledWith(
          'user123',
          'room123',
          query
        );
        expect(result).toEqual(mockMessages);
      });

      it('should get messages with pagination', async () => {
        const mockMessages = [mockMessage];
        const query: GetMessagesDto = {
          limit: 20,
          offset: 10,
          before: '2024-01-01T00:00:00.000Z',
        };

        jest
          .spyOn(service, 'getMessages')
          .mockResolvedValue(mockMessages as never);

        const result = await controller.getMessages(
          mockRequest,
          'room123',
          query
        );

        expect(service.getMessages).toHaveBeenCalledWith(
          'user123',
          'room123',
          query
        );
        expect(result).toEqual(mockMessages);
      });

      it('should handle room not found error', async () => {
        jest
          .spyOn(service, 'getMessages')
          .mockRejectedValue(new NotFoundException('Room not found'));

        await expect(
          controller.getMessages(mockRequest, 'nonexistent', {})
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle forbidden access error', async () => {
        jest
          .spyOn(service, 'getMessages')
          .mockRejectedValue(
            new ForbiddenException('You do not have access to this room')
          );

        await expect(
          controller.getMessages(mockRequest, 'room123', {})
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('PATCH /messages/:id', () => {
      it('should update message successfully', async () => {
        const updateMessageDto: UpdateMessageDto = {
          content: 'Updated message',
        };
        const updatedMessage = {
          ...mockMessage,
          content: 'Updated message',
          isEdited: true,
          editedAt: new Date(),
        };

        jest.spyOn(service, 'updateMessage').mockResolvedValue(updatedMessage);

        const result = await controller.updateMessage(
          mockRequest,
          'message123',
          updateMessageDto
        );

        expect(service.updateMessage).toHaveBeenCalledWith(
          'user123',
          'message123',
          updateMessageDto
        );
        expect(result).toEqual(updatedMessage);
      });

      it('should handle message not found error', async () => {
        const updateMessageDto: UpdateMessageDto = {
          content: 'Updated message',
        };

        jest
          .spyOn(service, 'updateMessage')
          .mockRejectedValue(new NotFoundException('Message not found'));

        await expect(
          controller.updateMessage(mockRequest, 'nonexistent', updateMessageDto)
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle forbidden error when not message owner', async () => {
        const updateMessageDto: UpdateMessageDto = {
          content: 'Updated message',
        };

        jest
          .spyOn(service, 'updateMessage')
          .mockRejectedValue(
            new ForbiddenException('You can only edit your own messages')
          );

        await expect(
          controller.updateMessage(mockRequest, 'message123', updateMessageDto)
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('DELETE /messages/:id', () => {
      it('should delete message successfully', async () => {
        const deletedMessage = {
          ...mockMessage,
          isDeleted: true,
          deletedAt: new Date(),
        };

        jest.spyOn(service, 'deleteMessage').mockResolvedValue(deletedMessage);

        const result = await controller.deleteMessage(
          mockRequest,
          'message123'
        );

        expect(service.deleteMessage).toHaveBeenCalledWith(
          'user123',
          'message123'
        );
        expect(result).toEqual(deletedMessage);
      });

      it('should handle message not found error', async () => {
        jest
          .spyOn(service, 'deleteMessage')
          .mockRejectedValue(new NotFoundException('Message not found'));

        await expect(
          controller.deleteMessage(mockRequest, 'nonexistent')
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle forbidden error when not message owner', async () => {
        jest
          .spyOn(service, 'deleteMessage')
          .mockRejectedValue(
            new ForbiddenException('You can only delete your own messages')
          );

        await expect(
          controller.deleteMessage(mockRequest, 'message123')
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('Room Endpoints', () => {
    describe('POST /messages/rooms/direct', () => {
      it('should create direct room successfully', async () => {
        const createDirectRoomDto: CreateDirectRoomDto = {
          targetUserId: 'user456',
        };

        jest.spyOn(service, 'createDirectRoom').mockResolvedValue(mockRoom);

        const result = await controller.createDirectRoom(
          mockRequest,
          createDirectRoomDto
        );

        expect(service.createDirectRoom).toHaveBeenCalledWith(
          'user123',
          createDirectRoomDto
        );
        expect(result).toEqual(mockRoom);
      });

      it('should return existing room if already exists', async () => {
        const createDirectRoomDto: CreateDirectRoomDto = {
          targetUserId: 'user456',
        };

        jest.spyOn(service, 'createDirectRoom').mockResolvedValue(mockRoom);
        jest.spyOn(console, 'log').mockImplementation();

        const result = await controller.createDirectRoom(
          mockRequest,
          createDirectRoomDto
        );

        expect(result).toEqual(mockRoom);
      });

      it('should handle target user not found error', async () => {
        const createDirectRoomDto: CreateDirectRoomDto = {
          targetUserId: 'nonexistent',
        };

        jest
          .spyOn(service, 'createDirectRoom')
          .mockRejectedValue(new NotFoundException('User not found'));
        jest.spyOn(console, 'log').mockImplementation();

        await expect(
          controller.createDirectRoom(mockRequest, createDirectRoomDto)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('GET /messages/rooms', () => {
      it('should get user rooms successfully', async () => {
        const mockRooms = [mockRoom];

        jest
          .spyOn(service, 'getUserRooms')
          .mockResolvedValue(mockRooms as never);

        const result = await controller.getUserRooms(mockRequest);

        expect(service.getUserRooms).toHaveBeenCalledWith('user123');
        expect(result).toEqual(mockRooms);
      });

      it('should return empty array if no rooms', async () => {
        jest.spyOn(service, 'getUserRooms').mockResolvedValue([]);

        const result = await controller.getUserRooms(mockRequest);

        expect(result).toEqual([]);
      });
    });

    describe('GET /messages/rooms/:id', () => {
      it('should get room by id successfully', async () => {
        jest.spyOn(service, 'getRoomById').mockResolvedValue(mockRoom);

        const result = await controller.getRoomById('room123');

        expect(service.getRoomById).toHaveBeenCalledWith('room123');
        expect(result).toEqual(mockRoom);
      });

      it('should handle room not found error', async () => {
        jest
          .spyOn(service, 'getRoomById')
          .mockRejectedValue(new NotFoundException('Room not found'));

        await expect(controller.getRoomById('nonexistent')).rejects.toThrow(
          NotFoundException
        );
      });
    });

    describe('POST /messages/rooms/:id/members', () => {
      it('should add member to room successfully', async () => {
        const addMemberDto: AddMemberDto = {
          userId: 'user789',
        };
        const updatedRoom = {
          ...mockRoom,
          members: [
            ...mockRoom.members,
            {
              userId: 'user789',
              role: MemberRole.MEMBER,
              joinedAt: new Date(),
            },
          ],
        };

        jest.spyOn(service, 'addMemberToRoom').mockResolvedValue(updatedRoom);

        const result = await controller.addMember(
          mockRequest,
          'room123',
          addMemberDto
        );

        expect(service.addMemberToRoom).toHaveBeenCalledWith(
          'user123',
          'room123',
          'user789'
        );
        expect(result).toEqual(updatedRoom);
      });

      it('should handle forbidden error when not admin', async () => {
        const addMemberDto: AddMemberDto = {
          userId: 'user789',
        };

        jest
          .spyOn(service, 'addMemberToRoom')
          .mockRejectedValue(
            new ForbiddenException(
              'Only room owners and admins can add members'
            )
          );

        await expect(
          controller.addMember(mockRequest, 'room123', addMemberDto)
        ).rejects.toThrow(ForbiddenException);
      });

      it('should handle room not found error', async () => {
        const addMemberDto: AddMemberDto = {
          userId: 'user789',
        };

        jest
          .spyOn(service, 'addMemberToRoom')
          .mockRejectedValue(new NotFoundException('Room not found'));

        await expect(
          controller.addMember(mockRequest, 'nonexistent', addMemberDto)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('DELETE /messages/rooms/:id/leave', () => {
      it('should leave room successfully', async () => {
        jest.spyOn(service, 'leaveRoom').mockResolvedValue(undefined);

        const result = await controller.leaveRoom(mockRequest, 'room123');

        expect(service.leaveRoom).toHaveBeenCalledWith('user123', 'room123');
        expect(result).toEqual({ message: 'Left room successfully' });
      });

      it('should handle room not found error', async () => {
        jest
          .spyOn(service, 'leaveRoom')
          .mockRejectedValue(new NotFoundException('Room not found'));

        await expect(
          controller.leaveRoom(mockRequest, 'nonexistent')
        ).rejects.toThrow(NotFoundException);
      });

      it('should handle bad request when not a member', async () => {
        jest
          .spyOn(service, 'leaveRoom')
          .mockRejectedValue(
            new NotFoundException('You are not a member of this room')
          );

        await expect(
          controller.leaveRoom(mockRequest, 'room123')
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('DELETE /messages/rooms/:id', () => {
      it('should delete room successfully (admin only)', async () => {
        jest.spyOn(service, 'deleteRoom').mockResolvedValue(undefined);

        const result = await controller.deleteRoom('room123');

        expect(service.deleteRoom).toHaveBeenCalledWith('room123');
        expect(result).toEqual({ message: 'Room deleted successfully' });
      });

      it('should handle room not found error', async () => {
        jest
          .spyOn(service, 'deleteRoom')
          .mockRejectedValue(new NotFoundException('Room not found'));

        await expect(controller.deleteRoom('nonexistent')).rejects.toThrow(
          NotFoundException
        );
      });
    });
  });

  describe('Online Users Endpoints', () => {
    describe('GET /messages/online-users', () => {
      it('should get online users successfully', async () => {
        jest
          .spyOn(service, 'getOnlineUsers')
          .mockResolvedValue(mockOnlineUsers);

        const result = await controller.getOnlineUsers();

        expect(service.getOnlineUsers).toHaveBeenCalled();
        expect(result).toEqual(mockOnlineUsers);
      });

      it('should return empty array if no online users', async () => {
        jest.spyOn(service, 'getOnlineUsers').mockResolvedValue([]);

        const result = await controller.getOnlineUsers();

        expect(result).toEqual([]);
      });
    });
  });

  describe('Guards', () => {
    it('should be protected by JwtAuthGuard', () => {
      const guards = Reflect.getMetadata('__guards__', MessagesController);
      const jwtGuard = guards.find(
        (guard: unknown) =>
          guard === JwtAuthGuard ||
          (guard as { name?: string }).name === 'JwtAuthGuard'
      );
      expect(jwtGuard).toBeTruthy();
    });

    it('should have AdminGuard on deleteRoom endpoint', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        MessagesController.prototype.deleteRoom
      );
      const adminGuard = guards?.find(
        (guard: unknown) =>
          guard === AdminGuard ||
          (guard as { name?: string }).name === 'AdminGuard'
      );
      expect(adminGuard).toBeTruthy();
    });
  });
});
