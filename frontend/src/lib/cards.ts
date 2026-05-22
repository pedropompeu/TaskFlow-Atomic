import { api } from './api';
import type { Card } from '@/types';

export const cardsApi = {
  listByBoard: (boardId: string) =>
    api.get<Card[]>(`/boards/${boardId}/cards`).then((r) => r.data),
  get: (id: string) => api.get<Card>(`/cards/${id}`).then((r) => r.data),
  create: (boardId: string, data: Partial<Card>) =>
    api.post<Card>(`/boards/${boardId}/cards`, data).then((r) => r.data),
  update: (id: string, data: Partial<Card>) =>
    api.patch<Card>(`/cards/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/cards/${id}`),
  reorder: (boardId: string, orderedIds: string[]) =>
    api.patch(`/boards/${boardId}/cards/reorder`, { orderedIds }),
  uploadAttachment: (id: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post(`/cards/${id}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
