import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor } from '@testing-library/react';

import { usersApi } from '@/lib/api';
import { User } from '@shared-types';

import CreateRoomModal from './CreateRoomModal';

// Mock the API
jest.mock('@/lib/api', () => ({
  usersApi: {
    getUsers: jest.fn(),
  },
}));

const mockUsers: User[] = [
  {
    id: '1',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    isAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    isAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    email: 'current@example.com',
    firstName: 'Current',
    lastName: 'User',
    isAdmin: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

describe('CreateRoomModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();
  const currentUserId = '3';

  beforeEach(() => {
    jest.clearAllMocks();
    (usersApi.getUsers as jest.Mock).mockResolvedValue({ data: mockUsers });
  });

  describe('Modal visibility', () => {
    it('should not render when closed', () => {
      render(
        <CreateRoomModal
          open={false}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      expect(
        screen.queryByText('Nouvelle conversation')
      ).not.toBeInTheDocument();
    });

    it('should render when open', () => {
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      expect(screen.getByText('Nouvelle conversation')).toBeInTheDocument();
    });
  });

  describe('User loading', () => {
    it('should load users when modal opens', async () => {
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(usersApi.getUsers).toHaveBeenCalled();
      });
    });

    it('should filter out current user from list', async () => {
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.queryByText('Current User')).not.toBeInTheDocument();
      });
    });

    it('should handle loading errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      (usersApi.getUsers as jest.Mock).mockRejectedValue(
        new Error('Network error')
      );

      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to load users:',
          expect.any(Error)
        );
      });

      consoleSpy.mockRestore();
    });
  });

  describe('User search', () => {
    it('should filter users by name', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Rechercher par nom ou email...'
      );
      await user.type(searchInput, 'jane');

      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should filter users by email', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Rechercher par nom ou email...'
      );
      await user.type(searchInput, 'john@example.com');

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    });

    it('should perform case-insensitive search', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(
        'Rechercher par nom ou email...'
      );
      await user.type(searchInput, 'JANE');

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('User selection', () => {
    it('should select user on click', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen
        .getByText('John Doe')
        .closest('div[class*="cursor-pointer"]');
      await user.click(johnCard!);

      expect(johnCard).toHaveClass('bg-primary/10');
    });

    it('should deselect user on second click', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen
        .getByText('John Doe')
        .closest('div[class*="cursor-pointer"]');
      await user.click(johnCard!);
      expect(johnCard).toHaveClass('bg-primary/10');

      await user.click(johnCard!);
      expect(johnCard).not.toHaveClass('bg-primary/10');
    });

    it('should only allow one selection at a time', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen
        .getByText('John Doe')
        .closest('div[class*="cursor-pointer"]');
      const janeCard = screen
        .getByText('Jane Smith')
        .closest('div[class*="cursor-pointer"]');

      await user.click(johnCard!);
      expect(johnCard).toHaveClass('bg-primary/10');

      await user.click(janeCard!);
      expect(janeCard).toHaveClass('bg-primary/10');
      expect(johnCard).not.toHaveClass('bg-primary/10');
    });
  });

  describe('Room creation', () => {
    it('should disable create button when no user selected', async () => {
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Créer' })).toBeDisabled();
      });
    });

    it('should enable create button when user selected', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen
        .getByText('John Doe')
        .closest('div[class*="cursor-pointer"]');
      await user.click(johnCard!);

      expect(screen.getByRole('button', { name: 'Créer' })).not.toBeDisabled();
    });

    it('should call onCreate with selected user id', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      const johnCard = screen
        .getByText('John Doe')
        .closest('div[class*="cursor-pointer"]');
      await user.click(johnCard!);

      const createButton = screen.getByRole('button', { name: 'Créer' });
      await user.click(createButton);

      expect(mockOnCreate).toHaveBeenCalledWith('1');
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should not create room with current user', async () => {
      const user = userEvent.setup();
      // Render with modified props to test edge case
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={'1'} // Set current user to John Doe
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // This test ensures the filtering works correctly
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    });
  });

  describe('Modal closing', () => {
    it('should close on X button click', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      const closeButton = screen
        .getByRole('button', { name: '' })
        .parentElement?.querySelector('button');
      await user.click(closeButton!);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should close on cancel button click', async () => {
      const user = userEvent.setup();
      render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset state when closing', async () => {
      const user = userEvent.setup();
      const { rerender } = render(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
      });

      // Select a user and search
      const johnCard = screen
        .getByText('John Doe')
        .closest('div[class*="cursor-pointer"]');
      await user.click(johnCard!);

      const searchInput = screen.getByPlaceholderText(
        'Rechercher par nom ou email...'
      );
      await user.type(searchInput, 'jane');

      // Close and reopen
      const cancelButton = screen.getByRole('button', { name: 'Annuler' });
      await user.click(cancelButton);

      rerender(
        <CreateRoomModal
          open={false}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      rerender(
        <CreateRoomModal
          open={true}
          onClose={mockOnClose}
          onCreate={mockOnCreate}
          currentUserId={currentUserId}
        />
      );

      // Check that state was reset
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      const newSearchInput = screen.getByPlaceholderText(
        'Rechercher par nom ou email...'
      );
      expect(newSearchInput).toHaveValue('');
    });
  });
});
