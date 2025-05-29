import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { WsException } from '@nestjs/websockets';
import { Test, TestingModule } from '@nestjs/testing';

import {
  WsJoinRoomDto,
  WsLeaveRoomDto,
  WsSendMessageDto,
} from '@backend/messages/dto/message.dto';
import { UserEntity } from '@backend/users/user.entity';
import { UsersService } from '@backend/users/users.service';
import { WsJwtGuard } from '@backend/messages/guards/ws-jwt.guard';
import { MessagesGateway } from '@backend/messages/messages.gateway';
import { MessagesService } from '@backend/messages/messages.service';
import { MessageType } from '@backend/messages/schemas/message.schema';
import { UserStatus } from '@backend/messages/schemas/online-user.schema';
import { RoomType, MemberRole } from '@backend/messages/schemas/room.schema';

describe('MessagesGateway', () => {
  let jwtService: JwtService;
  let gateway: MessagesGateway;
  let usersService: UsersService;
  let configService: ConfigService;
  let messagesService: MessagesService;

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
    validatePassword: jest.fn().mockResolvedValue(true),
    fullName: 'Test User',
  } as UserEntity;

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
    _id: 'room123',
    __v: 0,
  };

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

  const mockOnlineUser = {
    userId: 'user123',
    socketId: 'socket123',
    status: UserStatus.ONLINE,
    lastSeen: new Date(),
  };

  interface TestSocket extends Socket {
    userId?: string;
    user?: UserEntity;
    disconnect: jest.Mock;
  }

  const mockSocket = {
    id: 'socket123',
    userId: 'user123',
    user: mockUser,
    handshake: {
      auth: { token: 'valid.jwt.token' },
      headers: {},
    },
    join: jest.fn(),
    leave: jest.fn(),
    to: jest.fn().mockReturnThis(),
    emit: jest.fn(),
    disconnect: jest.fn(),
  } as unknown as TestSocket;

  const mockServer = {
    emit: jest.fn(),
    to: jest.fn().mockReturnThis(),
  } as unknown as Server;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MessagesGateway,
        {
          provide: MessagesService,
          useValue: {
            setUserOnline: jest.fn(),
            setUserOffline: jest.fn(),
            getUserRooms: jest.fn(),
            getRoomById: jest.fn(),
            createMessage: jest.fn(),
            getOnlineUsers: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            verify: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(WsJwtGuard)
      .useValue({ canActivate: () => true })
      .compile();

    gateway = module.get<MessagesGateway>(MessagesGateway);
    messagesService = module.get<MessagesService>(MessagesService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<ConfigService>(ConfigService);

    gateway.server = mockServer;

    jest.spyOn(jwtService, 'verify').mockReturnValue({ sub: 'user123' });
    jest.spyOn(configService, 'get').mockReturnValue('test-secret');
    jest.spyOn(usersService, 'findOne').mockResolvedValue(mockUser);
    jest
      .spyOn(messagesService, 'setUserOnline')
      .mockResolvedValue(mockOnlineUser);
    jest
      .spyOn(messagesService, 'getUserRooms')
      .mockResolvedValue([mockRoom] as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('handleConnection', () => {
    it('should handle successful connection', async () => {
      await gateway.handleConnection(mockSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token', {
        secret: 'test-secret',
      });
      expect(usersService.findOne).toHaveBeenCalledWith('user123');
      expect(messagesService.setUserOnline).toHaveBeenCalledWith(
        'user123',
        'socket123'
      );
      expect(messagesService.getUserRooms).toHaveBeenCalledWith('user123');
      expect(mockSocket.join).toHaveBeenCalledWith('room:room123');
      expect(mockServer.emit).toHaveBeenCalledWith('userConnected', {
        userId: 'user123',
        username: 'Test User',
      });
      expect(mockSocket.userId).toBe('user123');
      expect(mockSocket.user).toBe(mockUser);
    });

    it('should handle connection with token in headers', async () => {
      const socketWithHeaderToken = {
        ...mockSocket,
        handshake: {
          auth: {},
          headers: { authorization: 'Bearer valid.jwt.token' },
        },
      };

      await gateway.handleConnection(socketWithHeaderToken as TestSocket);

      expect(jwtService.verify).toHaveBeenCalledWith('valid.jwt.token', {
        secret: 'test-secret',
      });
    });

    it('should disconnect client if no token provided', async () => {
      const socketWithoutToken = {
        ...mockSocket,
        handshake: { auth: {}, headers: {} },
      };

      await gateway.handleConnection(socketWithoutToken as TestSocket);

      expect(socketWithoutToken.disconnect).toHaveBeenCalled();
      expect(jwtService.verify).not.toHaveBeenCalled();
      expect(usersService.findOne).not.toHaveBeenCalled();
      expect(messagesService.setUserOnline).not.toHaveBeenCalled();
    });

    it('should disconnect client if token verification fails', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(usersService.findOne).not.toHaveBeenCalled();
      expect(messagesService.setUserOnline).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalledWith(
        'userConnected',
        expect.anything()
      );
    });

    it('should disconnect client if user not found', async () => {
      jest
        .spyOn(usersService, 'findOne')
        .mockRejectedValue(new Error('User not found'));

      await gateway.handleConnection(mockSocket);

      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(jwtService.verify).toHaveBeenCalled();
      expect(usersService.findOne).toHaveBeenCalled();
      expect(messagesService.setUserOnline).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalledWith(
        'userConnected',
        expect.anything()
      );
    });
  });

  describe('handleDisconnect', () => {
    it('should handle user disconnect', async () => {
      // Setup connection first
      await gateway.handleConnection(mockSocket);

      // Then disconnect
      await gateway.handleDisconnect(mockSocket);

      expect(messagesService.setUserOffline).toHaveBeenCalledWith('socket123');
      expect(mockServer.emit).toHaveBeenCalledWith('userDisconnected', {
        userId: 'user123',
      });
    });

    it('should handle disconnect for unknown socket', async () => {
      await gateway.handleDisconnect(mockSocket);

      expect(messagesService.setUserOffline).not.toHaveBeenCalled();
      expect(mockServer.emit).not.toHaveBeenCalledWith(
        'userDisconnected',
        expect.any(Object)
      );
    });

    it('should remove user from connected users map on disconnect', async () => {
      // Setup connection first
      await gateway.handleConnection(mockSocket);

      // Verify user is in connected users map by attempting to send event
      gateway.sendToUser('user123', 'testEvent', { data: 'test' });
      expect(mockServer.to).toHaveBeenCalledWith('socket123');

      // Clear mocks and disconnect
      jest.clearAllMocks();
      await gateway.handleDisconnect(mockSocket);

      // Verify user is no longer in connected users map
      gateway.sendToUser('user123', 'testEvent', { data: 'test' });
      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe('handleJoinRoom', () => {
    const joinRoomDto: WsJoinRoomDto = {
      roomId: 'room123',
    };

    beforeEach(() => {
      jest.spyOn(messagesService, 'getRoomById').mockResolvedValue(mockRoom);
    });

    it('should join room successfully', async () => {
      const result = await gateway.handleJoinRoom(joinRoomDto, mockSocket);

      expect(messagesService.getRoomById).toHaveBeenCalledWith('room123');
      expect(mockSocket.join).toHaveBeenCalledWith('room:room123');
      expect(mockSocket.to).toHaveBeenCalledWith('room:room123');
      expect(mockSocket.emit).toHaveBeenCalledWith('userJoinedRoom', {
        userId: 'user123',
        username: 'Test User',
        roomId: 'room123',
      });
      expect(result).toEqual({ status: 'joined', roomId: 'room123' });
    });

    it('should throw exception if user has no access', async () => {
      const roomWithoutAccess = {
        ...mockRoom,
        members: [
          {
            userId: 'user456',
            role: MemberRole.MEMBER,
            joinedAt: new Date(),
          },
        ],
      };
      jest
        .spyOn(messagesService, 'getRoomById')
        .mockResolvedValue(roomWithoutAccess);

      await expect(
        gateway.handleJoinRoom(joinRoomDto, mockSocket)
      ).rejects.toThrow(WsException);
    });

    it('should throw exception if user has left the room', async () => {
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
      jest
        .spyOn(messagesService, 'getRoomById')
        .mockResolvedValue(roomWithLeftMember);

      await expect(
        gateway.handleJoinRoom(joinRoomDto, mockSocket)
      ).rejects.toThrow(WsException);
    });

    it('should handle room not found error', async () => {
      jest
        .spyOn(messagesService, 'getRoomById')
        .mockRejectedValue(new Error('Room not found'));

      await expect(
        gateway.handleJoinRoom(joinRoomDto, mockSocket)
      ).rejects.toThrow(WsException);
    });
  });

  describe('handleLeaveRoom', () => {
    const leaveRoomDto: WsLeaveRoomDto = {
      roomId: 'room123',
    };

    it('should leave room successfully', async () => {
      const result = await gateway.handleLeaveRoom(leaveRoomDto, mockSocket);

      expect(mockSocket.leave).toHaveBeenCalledWith('room:room123');
      expect(mockSocket.to).toHaveBeenCalledWith('room:room123');
      expect(mockSocket.emit).toHaveBeenCalledWith('userLeftRoom', {
        userId: 'user123',
        roomId: 'room123',
      });
      expect(result).toEqual({ status: 'left', roomId: 'room123' });
    });
  });

  describe('handleSendMessage', () => {
    const sendMessageDto: WsSendMessageDto = {
      content: 'Test message',
      roomId: 'room123',
      messageType: MessageType.TEXT,
    };

    beforeEach(() => {
      jest
        .spyOn(messagesService, 'createMessage')
        .mockResolvedValue(mockMessage);
    });

    it('should send message successfully', async () => {
      const result = await gateway.handleSendMessage(
        sendMessageDto,
        mockSocket
      );

      expect(messagesService.createMessage).toHaveBeenCalledWith('user123', {
        content: 'Test message',
        roomId: 'room123',
        messageType: MessageType.TEXT,
      });
      expect(mockServer.to).toHaveBeenCalledWith('room:room123');
      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', {
        ...mockMessage,
        senderInfo: {
          id: 'user123',
          username: 'Test User',
        },
      });
      expect(result).toEqual({ status: 'sent', messageId: 'message123' });
    });

    it('should throw exception if user not authenticated', async () => {
      const unauthenticatedSocket = {
        ...mockSocket,
        userId: undefined,
      };

      await expect(
        gateway.handleSendMessage(
          sendMessageDto,
          unauthenticatedSocket as TestSocket
        )
      ).rejects.toThrow(new WsException('User not authenticated'));
    });

    it('should handle message creation error', async () => {
      jest
        .spyOn(messagesService, 'createMessage')
        .mockRejectedValue(new Error('Failed to create message'));

      await expect(
        gateway.handleSendMessage(sendMessageDto, mockSocket)
      ).rejects.toThrow(new WsException('Failed to create message'));
    });

    it('should handle unknown user gracefully', async () => {
      const socketWithoutUser = {
        ...mockSocket,
        user: undefined,
      };

      const result = await gateway.handleSendMessage(
        sendMessageDto,
        socketWithoutUser as TestSocket
      );

      expect(mockServer.emit).toHaveBeenCalledWith('newMessage', {
        ...mockMessage,
        senderInfo: {
          id: 'user123',
          username: 'Unknown',
        },
      });
      expect(result).toEqual({ status: 'sent', messageId: 'message123' });
    });
  });

  describe('handleGetOnlineUsers', () => {
    it('should return online users', async () => {
      const mockOnlineUsers = [
        mockOnlineUser,
        { ...mockOnlineUser, userId: 'user456', socketId: 'socket456' },
      ];
      jest
        .spyOn(messagesService, 'getOnlineUsers')
        .mockResolvedValue(mockOnlineUsers);

      const result = await gateway.handleGetOnlineUsers();

      expect(messagesService.getOnlineUsers).toHaveBeenCalled();
      expect(result).toEqual({ onlineUsers: mockOnlineUsers });
    });

    it('should handle empty online users list', async () => {
      jest.spyOn(messagesService, 'getOnlineUsers').mockResolvedValue([]);

      const result = await gateway.handleGetOnlineUsers();

      expect(result).toEqual({ onlineUsers: [] });
    });
  });

  describe('sendToUser', () => {
    it('should send event to connected user', async () => {
      await gateway.handleConnection(mockSocket);

      gateway.sendToUser('user123', 'testEvent', { data: 'test' });

      expect(mockServer.to).toHaveBeenCalledWith('socket123');
      expect(mockServer.emit).toHaveBeenCalledWith('testEvent', {
        data: 'test',
      });
    });

    it('should not send event if user not connected', () => {
      gateway.sendToUser('user456', 'testEvent', { data: 'test' });

      expect(mockServer.to).not.toHaveBeenCalled();
    });
  });

  describe('Guards', () => {
    it('should use WsJwtGuard on joinRoom', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        MessagesGateway.prototype.handleJoinRoom
      );
      expect(guards).toContain(WsJwtGuard);
    });

    it('should use WsJwtGuard on leaveRoom', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        MessagesGateway.prototype.handleLeaveRoom
      );
      expect(guards).toContain(WsJwtGuard);
    });

    it('should use WsJwtGuard on sendMessage', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        MessagesGateway.prototype.handleSendMessage
      );
      expect(guards).toContain(WsJwtGuard);
    });

    it('should use WsJwtGuard on getOnlineUsers', () => {
      const guards = Reflect.getMetadata(
        '__guards__',
        MessagesGateway.prototype.handleGetOnlineUsers
      );
      expect(guards).toContain(WsJwtGuard);
    });
  });
});
