import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cardsApi } from '@/lib/cards';
import type { Card, CardStatus } from '@/types';

export const cardsKey = (boardId: string) => ['cards', boardId] as const;

export function useCards(boardId: string) {
  return useQuery({
    queryKey: cardsKey(boardId),
    queryFn: () => cardsApi.listByBoard(boardId),
    enabled: !!boardId,
  });
}

export function useCreateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Card>) => cardsApi.create(boardId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: cardsKey(boardId) }),
  });
}

export function useUpdateCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Card>) =>
      cardsApi.update(id, data),
    onMutate: async ({ id, status }) => {
      if (!status) return;
      await qc.cancelQueries({ queryKey: cardsKey(boardId) });
      const prev = qc.getQueryData<Card[]>(cardsKey(boardId));
      qc.setQueryData<Card[]>(cardsKey(boardId), (old) =>
        old?.map((c) => (c.id === id ? { ...c, status: status as CardStatus } : c)) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(cardsKey(boardId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: cardsKey(boardId) }),
  });
}

export function useReorderCards(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderedIds: string[]) => cardsApi.reorder(boardId, orderedIds),
    onMutate: async (orderedIds) => {
      await qc.cancelQueries({ queryKey: cardsKey(boardId) });
      const prev = qc.getQueryData<Card[]>(cardsKey(boardId));
      qc.setQueryData<Card[]>(cardsKey(boardId), (old) =>
        old?.map((c) => {
          const idx = orderedIds.indexOf(c.id);
          return idx !== -1 ? { ...c, position: idx } : c;
        }) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(cardsKey(boardId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: cardsKey(boardId) }),
  });
}

export function useDeleteCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardsApi.remove(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: cardsKey(boardId) });
      const prev = qc.getQueryData<Card[]>(cardsKey(boardId));
      qc.setQueryData<Card[]>(cardsKey(boardId), (old) =>
        old?.filter((c) => c.id !== id) ?? [],
      );
      return { prev };
    },
    onError: (_err, _vars, ctx: any) => {
      if (ctx?.prev) qc.setQueryData(cardsKey(boardId), ctx.prev);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: cardsKey(boardId) }),
  });
}

export function useAddAssignee(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      cardsApi.addAssignee(id, userId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cardsKey(boardId) });
      qc.invalidateQueries({ queryKey: ['card', id] });
    },
  });
}

export function useRemoveAssignee(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, userId }: { id: string; userId: string }) =>
      cardsApi.removeAssignee(id, userId),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: cardsKey(boardId) });
      qc.invalidateQueries({ queryKey: ['card', id] });
    },
  });
}

export const trashKey = (boardId: string) => ['trash', boardId] as const;

export function useTrash(boardId: string) {
  return useQuery({
    queryKey: trashKey(boardId),
    queryFn: () => cardsApi.listTrashed(boardId),
    enabled: !!boardId,
  });
}

export function useRestoreCard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cardsApi.restore(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardsKey(boardId) });
      qc.invalidateQueries({ queryKey: trashKey(boardId) });
    },
  });
}
