import { api } from './api';
import type { User } from '@/types';

export const usersApi = {
  list: () => api.get<User[]>('/users').then((r) => r.data),
};
