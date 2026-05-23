import { api } from './api';
import type { CardComment } from '@/types';

export const commentsApi = {
  create: (cardId: string, content: string) =>
    api.post<CardComment>(`/cards/${cardId}/comments`, { content }).then((r) => r.data),
  remove: (cardId: string, commentId: string) =>
    api.delete(`/cards/${cardId}/comments/${commentId}`),
};
