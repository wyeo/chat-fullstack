import React, {
  useState,
  useEffect,
  useContext,
  useCallback,
  createContext,
} from 'react';
import { useSocket } from '@/context/SocketContext';

import { messagesApi } from '@/lib/api';
import { Room, Message, WsNewMessageData } from '@shared-types';

interface ChatContextType {
  rooms: Room[];
  currentRoom: Room | null;
  messages: Record<string, Message[]>;
  isLoadingRooms: boolean;
  isLoadingMessages: boolean;
  setCurrentRoom: (room: Room | null) => void;
  loadRooms: () => Promise<void>;
  loadMessages: (roomId: string) => Promise<void>;
  createRoom: (memberId: string) => Promise<Room>;
  sendMessage: (content: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const {
    sendMessage: socketSendMessage,
    onNewMessage,
    offNewMessage,
  } = useSocket();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(false);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  const loadRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const response = await messagesApi.getRooms();

      setRooms(response.data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  const loadMessages = useCallback(async (roomId: string) => {
    setIsLoadingMessages(true);
    try {
      const response = await messagesApi.getMessages(roomId, { limit: 50 });
      setMessages((prev) => ({ ...prev, [roomId]: response.data }));
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  const createRoom = useCallback(async (memberId: string): Promise<Room> => {
    const response = await messagesApi.createDirectRoom({
      targetUserId: memberId,
    });
    const newRoom = response.data;
    setRooms((prev) => [...prev, newRoom]);
    return newRoom;
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!currentRoom) {
        throw new Error('No room selected');
      }

      try {
        await socketSendMessage(content, currentRoom.id);
      } catch (error) {
        console.error('Failed to send message:', error);
        throw error;
      }
    },
    [currentRoom, socketSendMessage]
  );

  useEffect(() => {
    const handleNewMessage = (data: WsNewMessageData) => {
      setMessages((prev) => {
        const roomMessages = prev[data.roomId] || [];
        if (roomMessages.some((msg) => msg.id === data.id)) {
          return prev;
        }

        return {
          ...prev,
          [data.roomId]: [...roomMessages, data as Message],
        };
      });

      setRooms((prev) =>
        prev.map((room) => {
          if (room.id === data.roomId) {
            return { ...room, lastMessage: data as Message };
          }
          return room;
        })
      );
    };

    onNewMessage(handleNewMessage);

    return () => {
      offNewMessage(handleNewMessage);
    };
  }, [onNewMessage, offNewMessage]);

  const value: ChatContextType = {
    rooms,
    currentRoom,
    messages,
    isLoadingRooms,
    isLoadingMessages,
    setCurrentRoom,
    loadRooms,
    loadMessages,
    createRoom,
    sendMessage,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
