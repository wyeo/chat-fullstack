import { Send, Plus, LogOut, Circle } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

import { User, Room, Message } from '@shared-types';

import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar } from '@/components/ui/avatar';

interface ChatInterfaceProps {
  currentUser: User;
  rooms: Room[];
  currentRoom: Room | null;
  messages: Message[];
  isConnected: boolean;
  onlineUsersCount: number;
  onSelectRoom: (room: Room) => void;
  onSendMessage: (content: string) => Promise<void>;
  onLogout: () => void;
  loadRooms: () => void;
  onCreateRoom: () => void;
}

export default function ChatInterface({
  currentUser,
  rooms,
  currentRoom,
  messages,
  isConnected,
  onSelectRoom,
  onSendMessage,
  onLogout,
  loadRooms,
  onCreateRoom,
}: ChatInterfaceProps) {
  const [messageInput, setMessageInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadRooms();
  }, [isConnected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!messageInput.trim() || !currentRoom || isSending) {
      return;
    }

    setIsSending(true);
    try {
      await onSendMessage(messageInput.trim());
      setMessageInput('');
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (date: string | Date) => {
    const messageDate = new Date(date);
    const now = new Date();
    const isToday = messageDate.toDateString() === now.toDateString();

    if (isToday) {
      return messageDate.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return messageDate.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 bg-primary text-white">
                <span className="text-sm w-full font-medium flex items-center justify-center">
                  {getInitials(currentUser.firstName, currentUser.lastName)}
                </span>
              </Avatar>
              <div>
                <p className="font-medium text-sm">
                  {currentUser.firstName} {currentUser.lastName}
                </p>
                <div className="flex items-center space-x-2">
                  <Circle
                    className={`h-2 w-2 ${
                      isConnected
                        ? 'fill-green-500 text-green-500'
                        : 'fill-red-500 text-red-500'
                    }`}
                  />
                  <span className="text-xs text-gray-500">
                    {isConnected ? 'En ligne' : 'Hors ligne'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              title="Se déconnecter"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="space-y-2">
              {rooms.map((room) => (
                <Card
                  key={room.id}
                  className={`p-3 cursor-pointer transition-colors ${
                    currentRoom?.id === room.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => onSelectRoom(room)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {room.name}
                      </p>
                      {room.lastMessage && (
                        <p className="text-xs text-gray-500 truncate">
                          {room.lastMessage.content}
                        </p>
                      )}
                    </div>
                    {room.lastMessage && (
                      <span className="text-xs text-gray-400">
                        {formatTime(room.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {currentRoom ? (
          <>
            <div className="bg-white border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold">{currentRoom.name}</h2>
              <p className="text-sm text-gray-500">
                {currentRoom.type === 'direct'
                  ? 'Conversation privée'
                  : 'Groupe'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {messages.map((message) => {
                  const isOwnMessage = message.senderId === currentUser.id;

                  return (
                    <div
                      key={message.id}
                      className={`flex ${
                        isOwnMessage ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md ${
                          isOwnMessage ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {!isOwnMessage && message.senderUsername && (
                            <span className="text-xs text-gray-500">
                              {message.senderUsername}
                            </span>
                          )}
                          <span className="text-xs text-gray-400">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="bg-white border-t border-gray-200 px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex space-x-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Écrivez votre message..."
                  disabled={isSending || !isConnected}
                  className="flex-1"
                />
                <Button
                  type="submit"
                  disabled={isSending || !messageInput.trim() || !isConnected}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gray-500 mb-4">
                Sélectionnez une conversation pour commencer
              </p>
              <Button onClick={onCreateRoom}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle conversation
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
