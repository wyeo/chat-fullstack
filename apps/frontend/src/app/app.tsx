import React, { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  BrowserRouter,
} from 'react-router-dom';

import { Message, Room } from '@shared-types';

import { useToast } from '@/hooks/use-toast';

import { ChatProvider, useChat } from '@/context/ChatContext';
import { SocketProvider, useSocket } from '@/context/SocketContext';
import { AuthProvider, RequireAuth, useAuth } from '@/context/AuthContext';

import LoginPage from '@/pages/auth/Login';
import RegisterPage from '@/pages/auth/Register';
import ChatInterface from '@/pages/chat/ChatRoom';

import { Toaster } from '@/components/ui/toaster';
import CreateRoomModal from '@/components/chat/CreateRoomModal';

function AppContent() {
  const {
    rooms,
    messages,
    currentRoom,
    loadRooms,
    setCurrentRoom,
    sendMessage,
    loadMessages,
    createRoom,
  } = useChat();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { login, register, logout, user } = useAuth();
  const { isConnected, onlineUsers, joinRoom, leaveRoom } = useSocket();

  const [selectedRoomMessages, setSelectedRoomMessages] = useState<Message[]>(
    []
  );
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);

  useEffect(() => {
    if (currentRoom) {
      setSelectedRoomMessages(messages[currentRoom.id] || []);
    }
  }, [currentRoom, messages]);

  const handleSelectRoom = async (room: Room) => {
    try {
      if (currentRoom && currentRoom.id !== room.id) {
        await leaveRoom(currentRoom.id);
      }

      await joinRoom(room.id);
      setCurrentRoom(room);

      await loadMessages(room.id);
    } catch (error) {
      console.error('Failed to change room:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de changer de conversation',
        variant: 'destructive',
      });
    }
  };

  const handleCreateRoom = () => {
    setShowCreateRoomModal(true);
  };

  const handleRoomCreated = async (memberId: string) => {
    try {
      const newRoom = await createRoom(memberId);

      toast({
        title: 'Conversation créée',
        description: `La conversation a été créée avec succès`,
      });
      await handleSelectRoom(newRoom);
    } catch {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la conversation',
        variant: 'destructive',
      });
    }
  };

  return (
    <>
      <Routes>
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/chat" />
            ) : (
              <LoginPage
                onLogin={login}
                onNavigateToRegister={() => navigate('/register')}
              />
            )
          }
        />

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/chat" />
            ) : (
              <RegisterPage
                onRegister={register}
                onNavigateToLogin={() => navigate('/login')}
              />
            )
          }
        />

        <Route
          path="/chat"
          element={
            <RequireAuth onNavigate={navigate}>
              {user && (
                <ChatInterface
                  currentUser={user}
                  rooms={rooms}
                  currentRoom={currentRoom}
                  messages={selectedRoomMessages}
                  isConnected={isConnected}
                  onlineUsersCount={onlineUsers.length}
                  onSelectRoom={handleSelectRoom}
                  onSendMessage={sendMessage}
                  onLogout={logout}
                  loadRooms={loadRooms}
                  onCreateRoom={handleCreateRoom}
                />
              )}
            </RequireAuth>
          }
        />

        <Route path="/" element={<Navigate to="/chat" />} />
      </Routes>
      {user && (
        <CreateRoomModal
          open={showCreateRoomModal}
          onClose={() => setShowCreateRoomModal(false)}
          onCreate={handleRoomCreated}
          currentUserId={user.id}
        />
      )}
      <Toaster />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppProvidersWrapper>
        <SocketProvider>
          <ChatProvider>
            <AppContent />
          </ChatProvider>
        </SocketProvider>
      </AppProvidersWrapper>
    </BrowserRouter>
  );
}

function AppProvidersWrapper({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const { toast } = useToast();

  return (
    <AuthProvider onNavigate={navigate} showToast={toast}>
      {children}
    </AuthProvider>
  );
}
