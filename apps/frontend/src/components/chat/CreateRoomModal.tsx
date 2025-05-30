import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';

import { User } from '@shared-types';
import { usersApi } from '@/lib/api';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreate: (memberId: string) => void;
  currentUserId: string;
}

export default function CreateRoomModal({
  open,
  onClose,
  onCreate,
  currentUserId,
}: CreateRoomModalProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (open) {
      loadUsers();
    }
  }, [open]);

  const loadUsers = async () => {
    setIsLoading(true);
    try {
      const response = await usersApi.getUsers();

      const otherUsers = response.data.filter(
        (user) => user.id !== currentUserId
      );
      setUsers(otherUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    if (!selectedUser) {
      return;
    }

    if (selectedUser === currentUserId) {
      return;
    }

    onCreate(selectedUser);
    handleClose();
  };

  const handleClose = () => {
    setSelectedUser(null);
    setSearchTerm('');
    onClose();
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUser === userId) {
      setSelectedUser(null);
    } else {
      setSelectedUser(userId);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      `${user.firstName} ${user.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Nouvelle conversation</h2>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-4">
            <Label htmlFor="userSearch">Sélectionner un utilisateur</Label>
            <Input
              id="userSearch"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom ou email..."
              className="mt-2"
            />
          </div>

          <div className="mb-4 max-h-48 overflow-y-auto">
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedUser === user.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-gray-50'
                  }`}
                  onClick={() => toggleUserSelection(user.id)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    {selectedUser === user.id && (
                      <div className="h-4 w-4 rounded-full bg-primary" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={handleClose}>
              Annuler
            </Button>
            <Button
              onClick={handleCreate}
              disabled={isLoading || !selectedUser}
            >
              Créer
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
