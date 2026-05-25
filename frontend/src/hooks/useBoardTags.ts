import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { BoardTag } from '@/types';

export const boardTagsKey = (boardId: string) => ['boardTags', boardId] as const;

export function useBoardTags(boardId: string) {
  return useQuery({
    queryKey: boardTagsKey(boardId),
    queryFn: () =>
      api.get<BoardTag[]>(`/boards/${boardId}/tags`).then((r) => r.data),
    enabled: !!boardId,
  });
}

export function useCreateBoardTag(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; color: string }) =>
      api.post<BoardTag>(`/boards/${boardId}/tags`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardTagsKey(boardId) }),
  });
}

export function useDeleteBoardTag(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tagId: string) =>
      api.delete(`/boards/${boardId}/tags/${tagId}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: boardTagsKey(boardId) }),
  });
}
