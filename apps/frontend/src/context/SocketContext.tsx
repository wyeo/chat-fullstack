import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  WsUserConnectedData,
  WsUserDisconnectedData,
  WsUserJoinedRoomData,
  WsUserLeftRoomData,
  WsNewMessageData,
  OnlineUser,
} from '@shared-types';
import { socketManager, TypedSocket } from '@/lib/socket';

interface SocketContextType {
  socket: TypedSocket | null;
  isConnected: boolean;
  onlineUsers: OnlineUser[];
  joinRoom: (roomId: string) => Promise<void>;
  leaveRoom: (roomId: string) => Promise<void>;
  sendMessage: (
    content: string,
    roomId: string,
    messageType?: 'text' | 'image'
  ) => Promise<string>;
  onUserConnected: (callback: (data: WsUserConnectedData) => void) => void;
  onUserDisconnected: (
    callback: (data: WsUserDisconnectedData) => void
  ) => void;
  onUserJoinedRoom: (callback: (data: WsUserJoinedRoomData) => void) => void;
  onUserLeftRoom: (callback: (data: WsUserLeftRoomData) => void) => void;
  onNewMessage: (callback: (data: WsNewMessageData) => void) => void;
  offUserConnected: (callback: (data: WsUserConnectedData) => void) => void;
  offUserDisconnected: (
    callback: (data: WsUserDisconnectedData) => void
  ) => void;
  offUserJoinedRoom: (callback: (data: WsUserJoinedRoomData) => void) => void;
  offUserLeftRoom: (callback: (data: WsUserLeftRoomData) => void) => void;
  offNewMessage: (callback: (data: WsNewMessageData) => void) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<TypedSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    if (isAuthenticated) {
      const newSocket = socketManager.connect();
      if (newSocket) {
        setSocket(newSocket);

        newSocket.on('connect', () => {
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          setIsConnected(false);
          setOnlineUsers([]);
        });
      }
    } else {
      socketManager.disconnect();
      setSocket(null);
      setIsConnected(false);
      setOnlineUsers([]);
    }

    return () => {
      socketManager.disconnect();
    };
  }, [isAuthenticated]);

  const joinRoom = useCallback(async (roomId: string) => {
    const result = await socketManager.joinRoom(roomId);
    if (result.status !== 'joined') {
      throw new Error('Failed to join room');
    }
  }, []);

  const leaveRoom = useCallback(async (roomId: string) => {
    const result = await socketManager.leaveRoom(roomId);
    if (result.status !== 'left') {
      throw new Error('Failed to leave room');
    }
  }, []);

  const sendMessage = useCallback(
    async (
      content: string,
      roomId: string,
      messageType: 'text' | 'image' = 'text'
    ) => {
      const result = await socketManager.sendMessage(
        content,
        roomId,
        messageType
      );
      if (result.status !== 'sent') {
        throw new Error('Failed to send message');
      }
      return result.messageId;
    },
    []
  );

  const onUserConnected = useCallback(
    (callback: (data: WsUserConnectedData) => void) => {
      socket?.on('userConnected', callback);
    },
    [socket]
  );

  const onUserDisconnected = useCallback(
    (callback: (data: WsUserDisconnectedData) => void) => {
      socket?.on('userDisconnected', callback);
    },
    [socket]
  );

  const onUserJoinedRoom = useCallback(
    (callback: (data: WsUserJoinedRoomData) => void) => {
      socket?.on('userJoinedRoom', callback);
    },
    [socket]
  );

  const onUserLeftRoom = useCallback(
    (callback: (data: WsUserLeftRoomData) => void) => {
      socket?.on('userLeftRoom', callback);
    },
    [socket]
  );

  const onNewMessage = useCallback(
    (callback: (data: WsNewMessageData) => void) => {
      socket?.on('newMessage', callback);
    },
    [socket]
  );

  const offUserConnected = useCallback(
    (callback: (data: WsUserConnectedData) => void) => {
      socket?.off('userConnected', callback);
    },
    [socket]
  );

  const offUserDisconnected = useCallback(
    (callback: (data: WsUserDisconnectedData) => void) => {
      socket?.off('userDisconnected', callback);
    },
    [socket]
  );

  const offUserJoinedRoom = useCallback(
    (callback: (data: WsUserJoinedRoomData) => void) => {
      socket?.off('userJoinedRoom', callback);
    },
    [socket]
  );

  const offUserLeftRoom = useCallback(
    (callback: (data: WsUserLeftRoomData) => void) => {
      socket?.off('userLeftRoom', callback);
    },
    [socket]
  );

  const offNewMessage = useCallback(
    (callback: (data: WsNewMessageData) => void) => {
      socket?.off('newMessage', callback);
    },
    [socket]
  );

  const value: SocketContextType = {
    socket,
    isConnected,
    onlineUsers,
    joinRoom,
    leaveRoom,
    sendMessage,
    onUserConnected,
    onUserDisconnected,
    onUserJoinedRoom,
    onUserLeftRoom,
    onNewMessage,
    offUserConnected,
    offUserDisconnected,
    offUserJoinedRoom,
    offUserLeftRoom,
    offNewMessage,
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
