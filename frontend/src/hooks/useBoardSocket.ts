'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { cardsKey, trashKey } from './useCards';
import { useMe } from './useMe';

export interface OnlineUser {
  userId: string;
  userName: string;
}

export function useBoardSocket(boardId: string) {
  const qc = useQueryClient();
  const { data: me } = useMe();
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!boardId || !me) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/boards`, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('join-board', {
        boardId,
        userId: me.id,
        userName: me.name,
      });
    });

    socket.on('board-updated', ({ type }: { type: string }) => {
      qc.invalidateQueries({ queryKey: cardsKey(boardId) });
      if (type === 'card-deleted' || type === 'card-restored') {
        qc.invalidateQueries({ queryKey: trashKey(boardId) });
      }
    });

    socket.on('presence', (data: { boardId: string; users: OnlineUser[] }) => {
      if (data.boardId === boardId) {
        setOnlineUsers(data.users);
      }
    });

    return () => {
      socket.emit('leave-board', { boardId });
      socket.disconnect();
      socketRef.current = null;
      setOnlineUsers([]);
    };
  }, [boardId, me, qc]);

  return { onlineUsers };
}
