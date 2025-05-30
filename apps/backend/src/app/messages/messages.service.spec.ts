import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';

import {
  CreateMessageDto,
  UpdateMessageDto,
  GetMessagesDto,
  CreateDirectRoomDto,
} from '@backend/messages/dto/message.dto';
import { UsersService } from '@backend/users/users.service';
import { MessagesService } from '@backend/messages/messages.service';
import { Message, MessageType } from '@backend/messages/schemas/message.schema';
import {
  Room,
  RoomType,
  MemberRole,
} from '@backend/messages/schemas/room.schema';
import {
  OnlineUser,
  UserStatus,
} from '@backend/messages/schemas/online-user.schema';

describe('MessagesService', () => {
  let service: MessagesService;
  let roomModel: Model<Room>;
  let messageModel: Model<Message>;
  let onlineUserModel: Model<OnlineUser>;
  let usersService: UsersService;

  const mockUser = {
    id: 'user123',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
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

  const mockTargetUser = {
    id: 'user456',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
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

  const mockRoom = {
    _id: 'room123',
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
    toJSON: jest.fn().mockReturnThis(),
  };

  const mockMessage = {
    _id: 'message123',
    id: 'message123',
    content: 'Test message',
    senderId: 'user123',
    senderUsername: 'John Doe',
    roomId: 'room123',
    timestamp: new Date(),
    messageType: MessageType.TEXT,
    isEdited: false,
    isDeleted: false,
    save: jest.fn(),
    toJSON: jest.fn().mockReturnThis(),
  };

  const mockOnlineUser = {
    _id: 'online123',
    userId: 'user123',
    socketId: 'socket123',
    status: UserStatus.ONLINE,
    lastSeen: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesService,
        {
          provide: getModelToken(Room.name),
          useValue: Object.assign(
            jest.fn().mockImplementation(() => ({
              ...mockRoom,
              save: jest.fn().mockResolvedValue({
                ...mockRoom,
                toJSON: jest.fn().mockReturnValue(mockRoom),
              }),
            })),
            {
              find: jest.fn(),
              findOne: jest.fn(),
              findById: jest.fn(),
              findByIdAndUpdate: jest.fn(),
              findOneAndUpdate: jest.fn(),
              create: jest.fn(),
              exec: jest.fn(),
              lean: jest.fn(),
              sort: jest.fn(),
            }
          ),
        },
        {
          provide: getModelToken(Message.name),
          useValue: Object.assign(
            jest.fn().mockImplementation(() => ({
              ...mockMessage,
              save: jest.fn().mockResolvedValue({
                ...mockMessage,
                toJSON: jest.fn().mockReturnValue(mockMessage),
              }),
            })),
            {
              find: jest.fn(),
              findById: jest.fn(),
              create: jest.fn(),
              deleteMany: jest.fn(),
              exec: jest.fn(),
              lean: jest.fn(),
              sort: jest.fn(),
              limit: jest.fn(),
              skip: jest.fn(),
            }
          ),
        },
        {
          provide: getModelToken(OnlineUser.name),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            deleteOne: jest.fn(),
            exec: jest.fn(),
            lean: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<MessagesService>(MessagesService);
    roomModel = module.get<Model<Room>>(getModelToken(Room.name));
    messageModel = module.get<Model<Message>>(getModelToken(Message.name));
    onlineUserModel = module.get<Model<OnlineUser>>(
      getModelToken(OnlineUser.name)
    );
    usersService = module.get<UsersService>(UsersService);

    // Setup default mocks
    jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);

    // Models are now properly mocked with constructor support
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Messages', () => {
    describe('createMessage', () => {
      const createMessageDto: CreateMessageDto = {
        content: 'Test message',
        roomId: 'room123',
        messageType: MessageType.TEXT,
      };

      beforeEach(() => {
        jest
          .spyOn(service, 'getRoomById' as keyof MessagesService)
          .mockResolvedValue(mockRoom);
        jest
          .spyOn(service, 'userHasAccessToRoom' as keyof MessagesService)
          .mockResolvedValue(true);

        // The messageModel constructor is already mocked in the module setup
      });

      it('should create a message successfully', async () => {
        const result = await service.createMessage('user123', createMessageDto);

        expect(service['getRoomById']).toHaveBeenCalledWith('room123');
        expect(service['userHasAccessToRoom']).toHaveBeenCalledWith(
          'user123',
          mockRoom
        );
        expect(usersService.findOne).toHaveBeenCalledWith('user123');
        expect(roomModel.findByIdAndUpdate).toHaveBeenCalledWith('room123', {
          lastActivity: expect.any(Date),
        });
        expect(result).toEqual(mockMessage);
      });

      it('should throw NotFoundException if room not found', async () => {
        jest
          .spyOn(service, 'getRoomById' as keyof MessagesService)
          .mockRejectedValue(new NotFoundException('Room not found'));

        await expect(
          service.createMessage('user123', createMessageDto)
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if user has no access', async () => {
        jest
          .spyOn(service, 'userHasAccessToRoom' as keyof MessagesService)
          .mockResolvedValue(false);

        await expect(
          service.createMessage('user123', createMessageDto)
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('getMessages', () => {
      const mockMessagesData = [
        { _id: 'message123', __v: 0, content: 'Test message', senderId: 'user123', senderUsername: 'John Doe', roomId: 'room123', timestamp: new Date('2024-01-01'), messageType: MessageType.TEXT, isEdited: false, isDeleted: false },
        { _id: 'message456', __v: 0, content: 'Test message 2', senderId: 'user123', senderUsername: 'John Doe', roomId: 'room123', timestamp: new Date('2024-01-02'), messageType: MessageType.TEXT, isEdited: false, isDeleted: false },
      ];

      const mockMessages = mockMessagesData.map(data => ({
        ...data,
        toJSON: jest.fn().mockReturnValue({
          id: data._id.toString(),
          content: data.content,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          roomId: data.roomId,
          timestamp: data.timestamp,
          messageType: data.messageType,
          isEdited: data.isEdited,
          isDeleted: data.isDeleted,
        }),
      }));

      beforeEach(() => {
        const chainMock = {
          find: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockMessages),
        };

        (messageModel.find as jest.Mock).mockReturnValue(chainMock);
        jest
          .spyOn(service, 'getRoomById' as keyof MessagesService)
          .mockResolvedValue(mockRoom);
        jest
          .spyOn(service, 'userHasAccessToRoom' as keyof MessagesService)
          .mockResolvedValue(true);
      });

      it('should get messages with default pagination and include id field', async () => {
        const query: GetMessagesDto = {};
        const result = await service.getMessages('user123', 'room123', query);

        const expectedMessages = mockMessagesData.map(data => ({
          id: data._id.toString(),
          content: data.content,
          senderId: data.senderId,
          senderUsername: data.senderUsername,
          roomId: data.roomId,
          timestamp: data.timestamp,
          messageType: data.messageType,
          isEdited: data.isEdited,
          isDeleted: data.isDeleted,
        }));
        
        expect(result).toEqual(expectedMessages);
        expect(messageModel.find).toHaveBeenCalledWith({
          roomId: 'room123',
          isDeleted: false,
          timestamp: { $lt: expect.any(Date) },
        });
      });

      it('should get messages with before timestamp', async () => {
        const beforeDate = '2024-01-15T00:00:00.000Z';
        const query: GetMessagesDto = { before: beforeDate };

        await service.getMessages('user123', 'room123', query);

        expect(messageModel.find).toHaveBeenCalledWith({
          roomId: 'room123',
          isDeleted: false,
          timestamp: { $lt: new Date(beforeDate) },
        });
      });

      it('should apply pagination parameters', async () => {
        const query: GetMessagesDto = { limit: 20, offset: 10 };
        const chainMock = {
          find: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          limit: jest.fn().mockReturnThis(),
          skip: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockMessages),
        };

        (messageModel.find as jest.Mock).mockReturnValue(chainMock);

        await service.getMessages('user123', 'room123', query);

        expect(chainMock.limit).toHaveBeenCalledWith(20);
        expect(chainMock.skip).toHaveBeenCalledWith(10);
      });

      it('should throw ForbiddenException if user has no access', async () => {
        jest
          .spyOn(service, 'userHasAccessToRoom' as keyof MessagesService)
          .mockResolvedValue(false);

        await expect(
          service.getMessages('user123', 'room123', {})
        ).rejects.toThrow(ForbiddenException);
      });
    });

    describe('updateMessage', () => {
      const updateMessageDto: UpdateMessageDto = {
        content: 'Updated message',
      };

      beforeEach(() => {
        const mockMessageInstance = {
          ...mockMessage,
          content: 'Updated message',
          isEdited: true,
          editedAt: new Date(),
          save: jest.fn().mockResolvedValue({
            ...mockMessage,
            content: 'Updated message',
            isEdited: true,
            editedAt: new Date(),
            toJSON: jest.fn().mockReturnValue({
              ...mockMessage,
              content: 'Updated message',
              isEdited: true,
              editedAt: new Date(),
            }),
          }),
        };
        (messageModel.findById as jest.Mock).mockResolvedValue(
          mockMessageInstance
        );
      });

      it('should update message successfully', async () => {
        const result = await service.updateMessage(
          'user123',
          'message123',
          updateMessageDto
        );

        expect(messageModel.findById).toHaveBeenCalledWith('message123');
        expect(result.content).toBe('Updated message');
        expect(result.isEdited).toBe(true);
        expect(result).toHaveProperty('editedAt');
      });

      it('should throw NotFoundException if message not found', async () => {
        (messageModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(
          service.updateMessage('user123', 'message123', updateMessageDto)
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if not message owner', async () => {
        (messageModel.findById as jest.Mock).mockResolvedValue({
          ...mockMessage,
          senderId: 'otherUser',
        });

        await expect(
          service.updateMessage('user123', 'message123', updateMessageDto)
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if message is deleted', async () => {
        (messageModel.findById as jest.Mock).mockResolvedValue({
          ...mockMessage,
          isDeleted: true,
        });

        await expect(
          service.updateMessage('user123', 'message123', updateMessageDto)
        ).rejects.toThrow(BadRequestException);
      });
    });

    describe('deleteMessage', () => {
      beforeEach(() => {
        const mockMessageInstance = {
          ...mockMessage,
          isDeleted: true,
          deletedAt: new Date(),
          save: jest.fn().mockResolvedValue({
            ...mockMessage,
            isDeleted: true,
            deletedAt: new Date(),
            toJSON: jest.fn().mockReturnValue({
              ...mockMessage,
              isDeleted: true,
              deletedAt: new Date(),
            }),
          }),
        };
        (messageModel.findById as jest.Mock).mockResolvedValue(
          mockMessageInstance
        );
      });

      it('should soft delete message successfully', async () => {
        const result = await service.deleteMessage('user123', 'message123');

        expect(messageModel.findById).toHaveBeenCalledWith('message123');
        expect(result.isDeleted).toBe(true);
        expect(result).toHaveProperty('deletedAt');
      });

      it('should throw NotFoundException if message not found', async () => {
        (messageModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(
          service.deleteMessage('user123', 'message123')
        ).rejects.toThrow(NotFoundException);
      });

      it('should throw ForbiddenException if not message owner', async () => {
        (messageModel.findById as jest.Mock).mockResolvedValue({
          ...mockMessage,
          senderId: 'otherUser',
        });

        await expect(
          service.deleteMessage('user123', 'message123')
        ).rejects.toThrow(ForbiddenException);
      });
    });
  });

  describe('Rooms', () => {
    describe('createDirectRoom', () => {
      const createDirectRoomDto: CreateDirectRoomDto = {
        targetUserId: 'user456',
      };

      beforeEach(() => {
        jest
          .spyOn(usersService, 'findOne')
          .mockImplementation(async (userId: string) => {
            if (userId === 'user123') return mockUser;
            if (userId === 'user456') return mockTargetUser;
            throw new NotFoundException();
          });

        // The roomModel constructor is already mocked in the module setup
      });

      it('should create direct room successfully', async () => {
        (roomModel.findOne as jest.Mock).mockResolvedValue(null);

        const result = await service.createDirectRoom(
          'user123',
          createDirectRoomDto
        );

        expect(usersService.findOne).toHaveBeenCalledWith('user456');
        expect(roomModel.findOne).toHaveBeenCalledWith({
          type: RoomType.DIRECT,
          $and: [
            { 'members.userId': 'user123' },
            { 'members.userId': 'user456' },
          ],
        });
        expect(result).toEqual(mockRoom);
      });

      it('should return existing room if already exists', async () => {
        (roomModel.findOne as jest.Mock).mockResolvedValue(mockRoom);

        const result = await service.createDirectRoom(
          'user123',
          createDirectRoomDto
        );

        expect(result).toEqual(mockRoom);
      });

      it('should throw NotFoundException if target user not found', async () => {
        jest
          .spyOn(usersService, 'findOne')
          .mockRejectedValue(new NotFoundException());

        await expect(
          service.createDirectRoom('user123', createDirectRoomDto)
        ).rejects.toThrow(NotFoundException);
      });
    });

    describe('getUserRooms', () => {
      const mockRooms = [
        { ...mockRoom, toJSON: jest.fn().mockReturnValue(mockRoom) },
        { ...mockRoom, id: 'room456', toJSON: jest.fn().mockReturnValue({ ...mockRoom, id: 'room456' }) }
      ];

      beforeEach(() => {
        const chainMock = {
          find: jest.fn().mockReturnThis(),
          sort: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockRooms),
        };

        (roomModel.find as jest.Mock).mockReturnValue(chainMock);
      });

      it('should get user rooms successfully', async () => {
        const result = await service.getUserRooms('user123');

        expect(roomModel.find).toHaveBeenCalledWith({
          'members.userId': 'user123',
          'members.leftAt': { $exists: false },
          isActive: true,
        });
        expect(result).toEqual([mockRoom, { ...mockRoom, id: 'room456' }]);
      });
    });

    describe('getRoomById', () => {
      beforeEach(() => {
        const mockRoomWithToJSON = { 
          ...mockRoom, 
          toJSON: jest.fn().mockReturnValue(mockRoom) 
        };
        const execMock = jest.fn().mockResolvedValue(mockRoomWithToJSON);
        (roomModel.findById as jest.Mock).mockReturnValue({ exec: execMock });
      });

      it('should get room by id successfully', async () => {
        const result = await service.getRoomById('room123');

        expect(roomModel.findById).toHaveBeenCalledWith('room123');
        expect(result).toEqual(mockRoom);
      });

      it('should throw NotFoundException if room not found', async () => {
        const execMock = jest.fn().mockResolvedValue(null);
        (roomModel.findById as jest.Mock).mockReturnValue({ exec: execMock });

        await expect(service.getRoomById('room123')).rejects.toThrow(
          NotFoundException
        );
      });
    });

    describe('addMemberToRoom', () => {
      beforeEach(() => {
        const mockRoomWithToJSON = {
          ...mockRoom,
          toJSON: jest.fn().mockReturnValue(mockRoom)
        };
        const roomSaveMock = jest.fn().mockResolvedValue(mockRoomWithToJSON);
        const mockRoomWithSave = {
          ...mockRoom,
          save: roomSaveMock,
        };
        (roomModel.findById as jest.Mock).mockResolvedValue(mockRoomWithSave);
      });

      it('should add new member to room successfully', async () => {
        const result = await service.addMemberToRoom(
          'user123',
          'room123',
          'user789'
        );

        expect(roomModel.findById).toHaveBeenCalledWith('room123');
        expect(result).toEqual(mockRoom);
      });

      it('should throw ForbiddenException if user is not admin', async () => {
        const roomWithMemberRole = {
          ...mockRoom,
          members: [
            {
              userId: 'user123',
              role: MemberRole.MEMBER,
              joinedAt: new Date(),
            },
          ],
        };
        (roomModel.findById as jest.Mock).mockResolvedValue(roomWithMemberRole);

        await expect(
          service.addMemberToRoom('user123', 'room123', 'user789')
        ).rejects.toThrow(ForbiddenException);
      });

      it('should throw BadRequestException if user already member', async () => {
        const roomWithExistingMember = {
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
        (roomModel.findById as jest.Mock).mockResolvedValue(
          roomWithExistingMember
        );

        await expect(
          service.addMemberToRoom('user123', 'room123', 'user789')
        ).rejects.toThrow(BadRequestException);
      });

      it('should rejoin member who left', async () => {
        const leftMember = {
          userId: 'user789',
          role: MemberRole.MEMBER,
          joinedAt: new Date('2024-01-01'),
          leftAt: new Date('2024-01-02'),
        };
        const roomWithLeftMember = {
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
            leftMember,
          ],
          isActive: true,
          lastActivity: new Date(),
          save: jest
            .fn()
            .mockImplementation(function (this: typeof roomWithLeftMember) {
              // Simulate the actual save behavior
              delete (leftMember as { leftAt?: Date }).leftAt;
              leftMember.joinedAt = new Date();
              return Promise.resolve({
                ...this,
                toJSON: () => this
              });
            }),
        };
        (roomModel.findById as jest.Mock).mockResolvedValue(roomWithLeftMember);

        await service.addMemberToRoom('user123', 'room123', 'user789');

        expect(leftMember.leftAt).toBeUndefined();
        expect(leftMember.joinedAt).toEqual(expect.any(Date));
      });
    });

    describe('leaveRoom', () => {
      beforeEach(() => {
        const roomSaveMock = jest.fn().mockResolvedValue(mockRoom);
        const mockRoomWithSave = {
          ...mockRoom,
          save: roomSaveMock,
        };
        (roomModel.findById as jest.Mock).mockResolvedValue(mockRoomWithSave);
      });

      it('should leave room successfully', async () => {
        await service.leaveRoom('user123', 'room123');

        expect(roomModel.findById).toHaveBeenCalledWith('room123');
        const member = mockRoom.members.find((m) => m.userId === 'user123');
        const memberWithLeftAt = member as typeof member & { leftAt?: Date };
        expect(memberWithLeftAt?.leftAt).toEqual(expect.any(Date));
      });

      it('should throw BadRequestException if not a member', async () => {
        const roomWithoutUser = {
          ...mockRoom,
          members: [
            {
              userId: 'user456',
              role: MemberRole.MEMBER,
              joinedAt: new Date(),
            },
          ],
        };
        (roomModel.findById as jest.Mock).mockResolvedValue(roomWithoutUser);

        await expect(service.leaveRoom('user123', 'room123')).rejects.toThrow(
          BadRequestException
        );
      });
    });

    describe('deleteRoom', () => {
      let roomInstance: typeof mockRoom & { save: jest.Mock };

      beforeEach(() => {
        roomInstance = {
          ...mockRoom,
          save: jest
            .fn()
            .mockImplementation(function (this: typeof roomInstance) {
              this.isActive = false;
              return Promise.resolve(this);
            }),
        };
        (roomModel.findById as jest.Mock).mockResolvedValue(roomInstance);
        (messageModel.deleteMany as jest.Mock).mockResolvedValue({});
      });

      it('should delete room and messages successfully', async () => {
        await service.deleteRoom('room123');

        expect(roomModel.findById).toHaveBeenCalledWith('room123');
        expect(roomInstance.isActive).toBe(false);
        expect(messageModel.deleteMany).toHaveBeenCalledWith({
          roomId: 'room123',
        });
      });

      it('should throw NotFoundException if room not found', async () => {
        (roomModel.findById as jest.Mock).mockResolvedValue(null);

        await expect(service.deleteRoom('room123')).rejects.toThrow(
          NotFoundException
        );
      });
    });
  });

  describe('Online Users', () => {
    describe('setUserOnline', () => {
      beforeEach(() => {
        (onlineUserModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
          mockOnlineUser
        );
      });

      it('should set user online successfully', async () => {
        const result = await service.setUserOnline('user123', 'socket123');

        expect(onlineUserModel.findOneAndUpdate).toHaveBeenCalledWith(
          { userId: 'user123' },
          {
            userId: 'user123',
            socketId: 'socket123',
            lastSeen: expect.any(Date),
            status: UserStatus.ONLINE,
          },
          { upsert: true, new: true, lean: true }
        );
        expect(result).toEqual(mockOnlineUser);
      });
    });

    describe('setUserOffline', () => {
      beforeEach(() => {
        (onlineUserModel.deleteOne as jest.Mock).mockResolvedValue({});
      });

      it('should set user offline successfully', async () => {
        await service.setUserOffline('socket123');

        expect(onlineUserModel.deleteOne).toHaveBeenCalledWith({
          socketId: 'socket123',
        });
      });
    });

    describe('updateUserStatus', () => {
      beforeEach(() => {
        (onlineUserModel.findOneAndUpdate as jest.Mock).mockResolvedValue(
          mockOnlineUser
        );
      });

      it('should update user status successfully', async () => {
        const result = await service.updateUserStatus(
          'user123',
          UserStatus.AWAY
        );

        expect(onlineUserModel.findOneAndUpdate).toHaveBeenCalledWith(
          { userId: 'user123' },
          { status: UserStatus.AWAY, lastSeen: expect.any(Date) },
          { new: true, lean: true }
        );
        expect(result).toEqual(mockOnlineUser);
      });
    });

    describe('getOnlineUsers', () => {
      const mockOnlineUsers = [
        mockOnlineUser,
        { ...mockOnlineUser, userId: 'user456' },
      ];

      beforeEach(() => {
        const chainMock = {
          find: jest.fn().mockReturnThis(),
          lean: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue(mockOnlineUsers),
        };

        (onlineUserModel.find as jest.Mock).mockReturnValue(chainMock);
      });

      it('should get online users successfully', async () => {
        const result = await service.getOnlineUsers();

        expect(onlineUserModel.find).toHaveBeenCalled();
        expect(result).toEqual(mockOnlineUsers);
      });
    });

    describe('isUserOnline', () => {
      it('should return true if user is online', async () => {
        (onlineUserModel.findOne as jest.Mock).mockResolvedValue(
          mockOnlineUser
        );

        const result = await service.isUserOnline('user123');

        expect(onlineUserModel.findOne).toHaveBeenCalledWith({
          userId: 'user123',
        });
        expect(result).toBe(true);
      });

      it('should return false if user is offline', async () => {
        (onlineUserModel.findOne as jest.Mock).mockResolvedValue(null);

        const result = await service.isUserOnline('user123');

        expect(result).toBe(false);
      });
    });
  });

  describe('Helpers', () => {
    describe('userHasAccessToRoom', () => {
      it('should return true if user is active member', async () => {
        // Create a fresh room object to avoid any interference
        const testRoom = {
          ...mockRoom,
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
        };
        const result = await service['userHasAccessToRoom'](
          'user123',
          testRoom
        );
        expect(result).toBe(true);
      });

      it('should return false if user is not member', async () => {
        // Create a fresh room object
        const testRoom = {
          ...mockRoom,
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
        };
        const result = await service['userHasAccessToRoom'](
          'user789',
          testRoom
        );
        expect(result).toBe(false);
      });

      it('should return false if user has left', async () => {
        const roomWithLeftMember = {
          ...mockRoom,
          members: [
            {
              userId: 'user123',
              role: MemberRole.MEMBER,
              joinedAt: new Date(),
              leftAt: new Date(),
            },
          ],
        };

        const result = await service['userHasAccessToRoom'](
          'user123',
          roomWithLeftMember
        );
        expect(result).toBe(false);
      });
    });
  });
});
