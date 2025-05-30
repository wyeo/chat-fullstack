import React, { createContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '@shared-types';
import { authApi, tokenUtils } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
  showToast: (toast: {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
  }) => void;
}

export function AuthProvider({
  children,
  onNavigate,
  showToast,
}: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = tokenUtils.get();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await authApi.profile();
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        tokenUtils.remove();
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      try {
        const response = await authApi.login(credentials);
        const data: AuthResponse = response.data;

        tokenUtils.set(data.accessToken);
        setUser(data.user);

        showToast({
          title: 'Connexion réussie',
          description: `Bienvenue ${data.user.firstName} !`,
        });

        onNavigate('/chat');
      } catch (error: Error | unknown) {
        showToast({
          title: 'Erreur de connexion',
          description:
            error instanceof Error
              ? error.message
              : 'Email ou mot de passe incorrect',
          variant: 'destructive',
        });
        throw error;
      }
    },
    [onNavigate, showToast]
  );

  const register = useCallback(async (credentials: RegisterCredentials) => {
    try {
      const response = await authApi.register(credentials);
      const data: AuthResponse = response.data;

      tokenUtils.set(data.accessToken);
      setUser(data.user);

      showToast({
        title: 'Inscription réussie',
        description: 'Votre compte a été créé avec succès !',
      });

      onNavigate('/chat');
    } catch (error: Error | unknown) {
      showToast({
        title: "Erreur d'inscription",
        description:
          error instanceof Error
            ? error.message
            : "Une erreur est survenue lors de l'inscription",
        variant: 'destructive',
      });
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      tokenUtils.remove();
      setUser(null);

      showToast({
        title: 'Déconnexion',
        description: 'Vous avez été déconnecté avec succès',
      });

      onNavigate('/login');
    }
  }, []);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface RequireAuthProps {
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export function RequireAuth({ children, onNavigate }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      onNavigate('/login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <div>{children}</div> : null;
}
