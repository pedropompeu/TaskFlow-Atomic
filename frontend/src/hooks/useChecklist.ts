import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { ChecklistItem } from '@/types';

export function useCreateChecklistItem(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) =>
      api.post<ChecklistItem>(`/cards/${cardId}/checklist`, { text }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });
}

export function useUpdateChecklistItem(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, ...data }: { itemId: string; text?: string; done?: boolean }) =>
      api.patch<ChecklistItem>(`/checklist-items/${itemId}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });
}

export function useDeleteChecklistItem(cardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/checklist-items/${itemId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['card', cardId] });
    },
  });
}
