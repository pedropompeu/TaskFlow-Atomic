import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '@/lib/boards';

export const BOARDS_KEY = ['boards'] as const;

export function useBoards() {
  return useQuery({
    queryKey: BOARDS_KEY,
    queryFn: boardsApi.list,
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: boardsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: BOARDS_KEY }),
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: boardsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: BOARDS_KEY }),
  });
}
