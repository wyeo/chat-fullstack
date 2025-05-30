import { Socket } from 'socket.io-client';

export interface ServerToClientEvents {
  userConnected: (data: any) => void;
  userDisconnected: (data: any) => void;
  userJoinedRoom: (data: any) => void;
  userLeftRoom: (data: any) => void;
  newMessage: (data: any) => void;
}

export interface ClientToServerEvents {
  joinRoom: (
    data: any,
    callback: (response: { status: string; roomId: string }) => void
  ) => void;
  leaveRoom: (
    data: any,
    callback: (response: { status: string; roomId: string }) => void
  ) => void;
  sendMessage: (
    data: any,
    callback: (response: { status: string; messageId: string }) => void
  ) => void;
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

class MockSocketManager {
  private socket: any = null;

  connect(): TypedSocket | null {
    this.socket = {
      connected: true,
      id: 'mock-socket-id',
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn(),
      removeAllListeners: jest.fn(),
      disconnect: jest.fn(),
    };
    return this.socket;
  }

  disconnect() {
    this.socket = null;
  }

  getSocket(): TypedSocket | null {
    return this.socket;
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  joinRoom(roomId: string): Promise<{ status: string; roomId: string }> {
    return Promise.resolve({ status: 'joined', roomId });
  }

  leaveRoom(roomId: string): Promise<{ status: string; roomId: string }> {
    return Promise.resolve({ status: 'left', roomId });
  }

  sendMessage(
    content: string,
    roomId: string,
    messageType: 'text' | 'image' = 'text'
  ): Promise<{ status: string; messageId: string }> {
    return Promise.resolve({ status: 'sent', messageId: 'mock-message-id' });
  }
}

export const socketManager = new MockSocketManager();