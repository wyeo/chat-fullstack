import React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen, waitFor, act } from '@testing-library/react';

import { authApi, tokenUtils } from '@/lib/api';
import { AuthResponse, User } from '@shared-types';

import { AuthProvider, useAuth, RequireAuth } from './AuthContext';

// Mock dependencies
jest.mock('@/lib/api', () => ({
  authApi: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    profile: jest.fn(),
  },
  tokenUtils: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn(),
  },
}));

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  firstName: 'John',
  lastName: 'Doe',
  isAdmin: false,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockAuthResponse: AuthResponse = {
  user: mockUser,
  accessToken: 'mock-token',
};

function TestComponent() {
  const auth = useAuth();
  const handleLogin = async () => {
    try {
      await auth.login({ email: 'test@example.com', password: 'password' });
    } catch (err) {
      // Error is expected in tests
    }
  };
  
  return (
    <div>
      <div data-testid="user-info">
        {auth.user ? `${auth.user.firstName} ${auth.user.lastName}` : 'No user'}
      </div>
      <div data-testid="is-authenticated">{auth.isAuthenticated.toString()}</div>
      <div data-testid="is-loading">{auth.isLoading.toString()}</div>
      <button onClick={handleLogin}>
        Login
      </button>
      <button onClick={() => auth.logout()}>Logout</button>
    </div>
  );
}

describe('AuthContext', () => {
  const mockOnNavigate = jest.fn();
  const mockShowToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should initialize with no user when no token exists', async () => {
      (tokenUtils.get as jest.Mock).mockReturnValue(null);

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('false');
    });

    it('should load user profile when token exists', async () => {
      (tokenUtils.get as jest.Mock).mockReturnValue('existing-token');
      (authApi.profile as jest.Mock).mockResolvedValue({ data: mockUser });

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      expect(screen.getByTestId('is-authenticated')).toHaveTextContent('true');
      expect(authApi.profile).toHaveBeenCalled();
    });

    it('should handle profile loading error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      (tokenUtils.get as jest.Mock).mockReturnValue('invalid-token');
      (authApi.profile as jest.Mock).mockRejectedValue(new Error('Unauthorized'));

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-loading')).toHaveTextContent('false');
      });

      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(tokenUtils.remove).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Auth check failed:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      (authApi.login as jest.Mock).mockResolvedValue({ data: mockAuthResponse });

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByText('Login');
      
      await act(async () => {
        loginButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      expect(authApi.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
      });
      expect(tokenUtils.set).toHaveBeenCalledWith('mock-token');
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Connexion réussie',
        description: 'Bienvenue John !',
      });
      expect(mockOnNavigate).toHaveBeenCalledWith('/chat');
    });

    it('should handle login error', async () => {
      const error = new Error('Invalid credentials');
      (authApi.login as jest.Mock).mockRejectedValue(error);

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestComponent />
        </AuthProvider>
      );

      const loginButton = screen.getByText('Login');
      await userEvent.click(loginButton);

      await waitFor(() => {
        expect(mockShowToast).toHaveBeenCalledWith({
          title: 'Erreur de connexion',
          description: 'Invalid credentials',
          variant: 'destructive',
        });
      });

      expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      expect(mockOnNavigate).not.toHaveBeenCalledWith('/chat');
    });
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      (authApi.register as jest.Mock).mockResolvedValue({ data: mockAuthResponse });

      let registerFunction: any;
      
      function TestRegisterComponent() {
        const auth = useAuth();
        registerFunction = auth.register;
        return null;
      }

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestRegisterComponent />
        </AuthProvider>
      );

      await act(async () => {
        await registerFunction({
          email: 'new@example.com',
          password: 'password',
          firstName: 'Jane',
          lastName: 'Doe',
        });
      });

      expect(authApi.register).toHaveBeenCalled();
      expect(tokenUtils.set).toHaveBeenCalledWith('mock-token');
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Inscription réussie',
        description: 'Votre compte a été créé avec succès !',
      });
      expect(mockOnNavigate).toHaveBeenCalledWith('/chat');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      (tokenUtils.get as jest.Mock).mockReturnValue('token');
      (authApi.profile as jest.Mock).mockResolvedValue({ data: mockUser });
      (authApi.logout as jest.Mock).mockResolvedValue({});

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      const logoutButton = screen.getByText('Logout');
      
      await act(async () => {
        logoutButton.click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('No user');
      });

      expect(authApi.logout).toHaveBeenCalled();
      expect(tokenUtils.remove).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith({
        title: 'Déconnexion',
        description: 'Vous avez été déconnecté avec succès',
      });
      expect(mockOnNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle logout error gracefully', async () => {
      (authApi.logout as jest.Mock).mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      let logoutFunction: any;
      
      function TestLogoutComponent() {
        const auth = useAuth();
        logoutFunction = auth.logout;
        return null;
      }

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestLogoutComponent />
        </AuthProvider>
      );

      await act(async () => {
        await logoutFunction();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Logout error:', expect.any(Error));
      expect(tokenUtils.remove).toHaveBeenCalled();
      expect(mockOnNavigate).toHaveBeenCalledWith('/login');

      consoleSpy.mockRestore();
    });
  });

  describe('updateUser', () => {
    it('should update user information', async () => {
      (tokenUtils.get as jest.Mock).mockReturnValue('token');
      (authApi.profile as jest.Mock).mockResolvedValue({ data: mockUser });

      let updateUserFunction: any;
      
      function TestUpdateComponent() {
        const auth = useAuth();
        updateUserFunction = auth.updateUser;
        return <TestComponent />;
      }

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <TestUpdateComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-info')).toHaveTextContent('John Doe');
      });

      const updatedUser = { ...mockUser, firstName: 'Jane' };
      
      act(() => {
        updateUserFunction(updatedUser);
      });

      expect(screen.getByTestId('user-info')).toHaveTextContent('Jane Doe');
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('RequireAuth', () => {
    it('should render children when authenticated', async () => {
      (tokenUtils.get as jest.Mock).mockReturnValue('token');
      (authApi.profile as jest.Mock).mockResolvedValue({ data: mockUser });

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <RequireAuth onNavigate={mockOnNavigate}>
            <div>Protected content</div>
          </RequireAuth>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText('Protected content')).toBeInTheDocument();
      });
    });

    it('should redirect to login when not authenticated', async () => {
      (tokenUtils.get as jest.Mock).mockReturnValue(null);

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <RequireAuth onNavigate={mockOnNavigate}>
            <div>Protected content</div>
          </RequireAuth>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(mockOnNavigate).toHaveBeenCalledWith('/login');
      });

      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });

    it('should show loading spinner while checking auth', () => {
      (tokenUtils.get as jest.Mock).mockReturnValue('token');
      (authApi.profile as jest.Mock).mockImplementation(
        () => new Promise(() => { /* Never resolves */ })
      );

      render(
        <AuthProvider onNavigate={mockOnNavigate} showToast={mockShowToast}>
          <RequireAuth onNavigate={mockOnNavigate}>
            <div>Protected content</div>
          </RequireAuth>
        </AuthProvider>
      );

    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
    });
  });
});