import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';
import { notificationsApi } from '@/lib/notifications';
import { useMe } from './useMe';
import type { AppNotification } from '@/types';

export const NOTIFICATIONS_KEY = ['notifications'];

export function useNotifications() {
  const qc = useQueryClient();
  const { data: me } = useMe();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: notificationsApi.list,
    enabled: !!me,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (!me) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/notifications`, {
      transports: ['websocket'],
      withCredentials: true,
    });
    socket.on('connect', () => socket.emit('identify', { userId: me.id }));
    socket.on('notification', (n: AppNotification) => {
      qc.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (prev = []) => [n, ...prev]);
    });
    return () => { socket.disconnect(); };
  }, [me, qc]);

  return query;
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onMutate: (id) => {
      qc.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (prev = []) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
      );
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markAllRead,
    onMutate: () => {
      qc.setQueryData<AppNotification[]>(NOTIFICATIONS_KEY, (prev = []) =>
        prev.map((n) => ({ ...n, read: true })),
      );
    },
  });
}
