import { api } from './api';
import type { Board, BoardMembers, BoardMemberEntry } from '@/types';

export const boardsApi = {
  list: () => api.get<Board[]>('/boards').then((r) => r.data),
  get: (id: string) => api.get<Board>(`/boards/${id}`).then((r) => r.data),
  create: (data: { title: string; description?: string }) =>
    api.post<Board>('/boards', data).then((r) => r.data),
  update: (id: string, data: { title?: string; description?: string }) =>
    api.patch<Board>(`/boards/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/boards/${id}`),

  // Members
  getMembers: (boardId: string) =>
    api.get<BoardMembers>(`/boards/${boardId}/members`).then((r) => r.data),
  inviteMember: (boardId: string, email: string) =>
    api.post<BoardMemberEntry>(`/boards/${boardId}/members`, { email }).then((r) => r.data),
  removeMember: (boardId: string, userId: string) =>
    api.delete(`/boards/${boardId}/members/${userId}`),
};
