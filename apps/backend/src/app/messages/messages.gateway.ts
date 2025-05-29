import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { ConfigService } from '@nestjs/config';
import { UseGuards, Injectable, Logger } from '@nestjs/common';

import {
  WsJoinRoomDto,
  WsLeaveRoomDto,
  WsSendMessageDto,
} from '@backend/messages/dto/message.dto';
import { UserEntity } from '@backend/app/users/user.entity';
import { UsersService } from '@backend/app/users/users.service';
import { WsJwtGuard } from '@backend/messages/guards/ws-jwt.guard';
import { MessagesService } from '@backend/messages/messages.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: UserEntity;
}

@Injectable()
@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:4200',
    credentials: true,
  },
  namespace: '/chat',
})
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(MessagesGateway.name);
  private connectedUsers = new Map<string, string>();

  constructor(
    private readonly messagesService: MessagesService,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        throw new WsException('No token provided');
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      client.userId = payload.sub;
      const user = await this.usersService.findOne(payload.sub);
      client.user = user;

      await this.messagesService.setUserOnline(payload.sub, client.id);
      this.connectedUsers.set(client.id, payload.sub);

      const userRooms = await this.messagesService.getUserRooms(payload.sub);
      for (const room of userRooms) {
        client.join(`room:${room.id}`);
      }

      this.server.emit('userConnected', {
        userId: payload.sub,
        username: `${user.firstName} ${user.lastName}`,
      });

      this.logger.log(
        `User ${payload.sub} connected with socket ${client.id}`,
        {
          userId: payload.sub,
          socketId: client.id,
          username: `${user.firstName} ${user.lastName}`,
        }
      );
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error('Connection failed', errorStack, {
        socketId: client.id,
        error: errorMessage,
      });
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = this.connectedUsers.get(client.id);

    if (userId) {
      await this.messagesService.setUserOffline(client.id);
      this.connectedUsers.delete(client.id);

      this.server.emit('userDisconnected', { userId });

      this.logger.log(`User ${userId} disconnected`, {
        userId,
        socketId: client.id,
      });
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @MessageBody() data: WsJoinRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    try {
      const room = await this.messagesService.getRoomById(data.roomId);

      const hasAccess = room.members.some(
        (m) => m.userId === client.userId && !m.leftAt
      );
      if (!hasAccess) {
        throw new WsException('Access denied to this room');
      }

      client.join(`room:${data.roomId}`);

      client.to(`room:${data.roomId}`).emit('userJoinedRoom', {
        userId: client.userId,
        username: client.user
          ? `${client.user.firstName} ${client.user.lastName}`
          : 'Unknown',
        roomId: data.roomId,
      });

      return { status: 'joined', roomId: data.roomId };
    } catch (error) {
      throw new WsException(
        error instanceof Error ? error.message : 'Failed to join room'
      );
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(
    @MessageBody() data: WsLeaveRoomDto,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    client.leave(`room:${data.roomId}`);

    client.to(`room:${data.roomId}`).emit('userLeftRoom', {
      userId: client.userId,
      roomId: data.roomId,
    });

    return { status: 'left', roomId: data.roomId };
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody() data: WsSendMessageDto,
    @ConnectedSocket() client: AuthenticatedSocket
  ) {
    try {
      if (!client.userId) {
        throw new WsException('User not authenticated');
      }
      const message = await this.messagesService.createMessage(client.userId, {
        content: data.content,
        roomId: data.roomId,
        messageType: data.messageType,
      });

      this.server.to(`room:${data.roomId}`).emit('newMessage', {
        ...message,
        senderInfo: {
          id: client.userId,
          username: client.user
            ? `${client.user.firstName} ${client.user.lastName}`
            : 'Unknown',
        },
      });

      return { status: 'sent', messageId: message.id };
    } catch (error) {
      throw new WsException(
        error instanceof Error ? error.message : 'Failed to send message'
      );
    }
  }

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('getOnlineUsers')
  async handleGetOnlineUsers() {
    const onlineUsers = await this.messagesService.getOnlineUsers();
    return { onlineUsers };
  }

  sendToUser(userId: string, event: string, data: unknown) {
    const socketId = Array.from(this.connectedUsers.entries()).find(
      ([, id]) => id === userId
    )?.[0];

    if (socketId) {
      this.server.to(socketId).emit(event, data);
    }
  }
}
