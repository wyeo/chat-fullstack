import axios, { AxiosInstance } from 'axios';

import {
  User,
  Room,
  Message,
  AuthResponse,
  LoginCredentials,
  RegisterCredentials,
} from '@shared-types';

const API_BASE_URL =
  (typeof window !== 'undefined' &&
    (window as any).import?.meta?.env?.VITE_API_URL) ||
  'http://localhost:3333/api';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const tokenUtils = {
  get: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  },
  set: (token: string): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('auth_token', token);
  },
  remove: (): void => {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('auth_token');
  },
};

axiosInstance.interceptors.request.use(
  (config) => {
    const token = tokenUtils.get();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      tokenUtils.remove();
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error.response?.data || error);
  }
);

export const authApi = {
  login: (credentials: LoginCredentials) =>
    axiosInstance.post<AuthResponse>('/auth/login', credentials),

  register: (credentials: RegisterCredentials) =>
    axiosInstance.post<AuthResponse>('/auth/register', credentials),

  logout: () => axiosInstance.post('/auth/logout'),

  profile: () => axiosInstance.get<User>('/auth/profile'),
};

export const messagesApi = {
  getRooms: () => axiosInstance.get<Room[]>('/messages/rooms'),

  getMessages: (roomId: string, params?: { limit?: number; offset?: number }) =>
    axiosInstance.get<Message[]>(`/messages/room/${roomId}`, { params }),

  createDirectRoom: (data: { targetUserId: string }) =>
    axiosInstance.post<Room>('/messages/rooms/direct', data),
};

export const usersApi = {
  getUsers: () => axiosInstance.get<User[]>('/users'),

  getUser: (id: string) => axiosInstance.get<User>(`/users/${id}`),

  updateUser: (id: string, data: Partial<User>) =>
    axiosInstance.patch<User>(`/users/${id}`, data),
};
