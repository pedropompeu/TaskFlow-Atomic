import { api } from './api';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  createdAt: string;
}

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ message: string }>('/auth/register', data),

  login: (data: { email: string; password: string }) =>
    api.post<{ message: string }>('/auth/login', data),

  logout: () => api.post<{ message: string }>('/auth/logout'),

  refresh: () => api.post<{ message: string }>('/auth/refresh'),

  me: () => api.get<User>('/auth/me'),
};
