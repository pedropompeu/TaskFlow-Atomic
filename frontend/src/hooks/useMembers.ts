import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { boardsApi } from '@/lib/boards';

const membersKey = (boardId: string) => ['board-members', boardId];

export function useMembers(boardId: string) {
  return useQuery({
    queryKey: membersKey(boardId),
    queryFn: () => boardsApi.getMembers(boardId),
    enabled: !!boardId,
  });
}

export function useInviteMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => boardsApi.inviteMember(boardId, email),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(boardId) }),
  });
}

export function useRemoveMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => boardsApi.removeMember(boardId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: membersKey(boardId) }),
  });
}
