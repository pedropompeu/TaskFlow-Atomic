'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';

// Observa rooms de boards sem afetar a presença dos quadros.
// Retorna isConnected para que a UI exiba o indicador "Ao vivo".
export function useAnalyticsSocket(boardIds: string[]) {
  const qc                              = useQueryClient();
  const socketRef                       = useRef<Socket | null>(null);
  const [isConnected, setIsConnected]   = useState(false);
  const roomsKey                        = boardIds.join(',');

  useEffect(() => {
    if (boardIds.length === 0) {
      setIsConnected(false);
      return;
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(`${apiUrl}/boards`, {
      transports: ['websocket'],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      boardIds.forEach((id) => socket.emit('watch-board', { boardId: id }));
    });

    socket.on('disconnect', () => setIsConnected(false));

    socket.on('board-updated', () => {
      qc.invalidateQueries({ queryKey: ['analytics'] });
      qc.invalidateQueries({ queryKey: ['analytics-activity'] });
    });

    return () => {
      if (socket.connected) {
        boardIds.forEach((id) => socket.emit('unwatch-board', { boardId: id }));
      }
      socket.disconnect();
      socketRef.current = null;
      setIsConnected(false);
    };
  }, [roomsKey, qc]); // eslint-disable-line react-hooks/exhaustive-deps

  return { isConnected };
}
