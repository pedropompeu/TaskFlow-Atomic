import { useMutation, useQueryClient } from '@tanstack/react-query';
import { commentsApi } from '@/lib/comments';
import { cardsKey } from './useCards';

export function useCreateComment(cardId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (content: string) => commentsApi.create(cardId, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card', cardId] });
      qc.invalidateQueries({ queryKey: cardsKey(boardId) });
    },
  });
}

export function useDeleteComment(cardId: string, boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(cardId, commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card', cardId] });
      qc.invalidateQueries({ queryKey: cardsKey(boardId) });
    },
  });
}
