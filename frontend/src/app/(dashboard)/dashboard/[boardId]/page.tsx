'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardEditModal } from '@/components/kanban/CardEditModal';
import { boardsApi } from '@/lib/boards';
import { useBoardSocket } from '@/hooks/useBoardSocket';
import type { Card } from '@/types';

const AVATAR_COLORS = ['#F78E2F', '#A559FD', '#43AC8D', '#1D84B7', '#FDCC32'];

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [filterText, setFilterText] = useState('');
  const { onlineUsers } = useBoardSocket(boardId);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardsApi.get(boardId),
    enabled: !!boardId,
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-stone-200 rounded" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 h-96 bg-stone-100 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-20 text-stone-400">
        <p>Quadro não encontrado.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-1.5 text-atomic-gray-500 hover:text-atomic-dark hover:bg-atomic-ice rounded-lg transition-colors"
          aria-label="Voltar aos quadros"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-atomic-dark">{board.title}</h2>
          {board.description && (
            <p className="text-sm text-atomic-gray-500 mt-0.5">{board.description}</p>
          )}
        </div>
        {/* Presença — usuários online no board */}
        {onlineUsers.length > 0 && (
          <div className="flex items-center -space-x-2">
            {onlineUsers.slice(0, 5).map((u, i) => (
              <div
                key={u.userId}
                title={u.userName}
                style={{
                  backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  zIndex: 10 - i,
                }}
                className="relative w-7 h-7 rounded-full border-2 border-white flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
              >
                {u.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div
                style={{ zIndex: 5 }}
                className="relative w-7 h-7 rounded-full border-2 border-white bg-atomic-gray-500 flex items-center justify-center text-[11px] font-bold text-white shadow-sm"
              >
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        )}

        {/* Busca */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-atomic-gray-500 pointer-events-none" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filtrar cards…"
            className="pl-8 pr-7 py-1.5 text-sm border border-atomic-gray-300/50 rounded-lg bg-white/70 focus:outline-none focus:ring-2 focus:ring-atomic-orange/40 w-44 transition-all focus:w-56"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-atomic-gray-500 hover:text-atomic-dark"
              aria-label="Limpar filtro"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard
        boardId={boardId}
        onEditCard={(card) => setEditingCard(card)}
        filterText={filterText}
      />

      <AnimatePresence>
        {editingCard && (
          <CardEditModal
            key={editingCard.id}
            card={editingCard}
            boardId={boardId}
            onClose={() => setEditingCard(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
