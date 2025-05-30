import { io, Socket } from 'socket.io-client';
import {
  WsJoinRoomData,
  WsLeaveRoomData,
  WsSendMessageData,
  WsUserConnectedData,
  WsUserDisconnectedData,
  WsUserJoinedRoomData,
  WsUserLeftRoomData,
  WsNewMessageData,
} from '@shared-types';
import { tokenUtils } from './api';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3333';

export interface ServerToClientEvents {
  userConnected: (data: WsUserConnectedData) => void;
  userDisconnected: (data: WsUserDisconnectedData) => void;
  userJoinedRoom: (data: WsUserJoinedRoomData) => void;
  userLeftRoom: (data: WsUserLeftRoomData) => void;
  newMessage: (data: WsNewMessageData) => void;
}

export interface ClientToServerEvents {
  joinRoom: (
    data: WsJoinRoomData,
    callback: (response: { status: string; roomId: string }) => void
  ) => void;
  leaveRoom: (
    data: WsLeaveRoomData,
    callback: (response: { status: string; roomId: string }) => void
  ) => void;
  sendMessage: (
    data: WsSendMessageData,
    callback: (response: { status: string; messageId: string }) => void
  ) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class SocketManager {
  private socket: TypedSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // 1 seconde

  connect(): TypedSocket | null {
    if (this.socket?.connected) {
      return this.socket;
    }

    const token = tokenUtils.get();
    if (!token) {
      console.warn('No token available for socket connection');
      return null;
    }

    this.socket = io(`${WS_URL}/chat`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      reconnectionDelayMax: 10000,
      transports: ['websocket', 'polling'],
    }) as TypedSocket;

    this.setupEventHandlers();
    return this.socket;
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);

      if (reason === 'io server disconnect') {
        this.disconnect();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('Max reconnection attempts reached');
        this.disconnect();
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  joinRoom(roomId: string): Promise<{ status: string; roomId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('joinRoom', { roomId }, (response) => {
        if (response.status === 'joined') {
          resolve(response);
        } else {
          reject(new Error('Failed to join room'));
        }
      });
    });
  }

  leaveRoom(roomId: string): Promise<{ status: string; roomId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit('leaveRoom', { roomId }, (response) => {
        if (response.status === 'left') {
          resolve(response);
        } else {
          reject(new Error('Failed to leave room'));
        }
      });
    });
  }

  sendMessage(
    content: string,
    roomId: string,
    messageType: 'text' | 'image' = 'text'
  ): Promise<{ status: string; messageId: string }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.socket.emit(
        'sendMessage',
        { content, roomId, messageType },
        (response) => {
          if (response.status === 'sent') {
            resolve(response);
          } else {
            reject(new Error('Failed to send message'));
          }
        }
      );
    });
  }
}

export const socketManager = new SocketManager();
