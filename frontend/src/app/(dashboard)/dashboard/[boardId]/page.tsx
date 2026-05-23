'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardEditModal } from '@/components/kanban/CardEditModal';
import { BoardMembersPanel } from '@/components/kanban/BoardMembersPanel';
import { BoardCoverPicker } from '@/components/kanban/BoardCoverPicker';
import { boardsApi } from '@/lib/boards';
import { useBoardSocket } from '@/hooks/useBoardSocket';
import { useMe } from '@/hooks/useMe';
import type { Card } from '@/types';

const AVATAR_COLORS = ['#F78E2F', '#A559FD', '#43AC8D', '#1D84B7', '#FDCC32'];

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

function applyBackground(type: string | null, value: string | null) {
  const root = document.getElementById('dashboard-root');
  if (!root) return;
  root.style.transition = 'background 0.6s ease';
  if (!type || !value) {
    root.style.background = '';
    return;
  }
  if (type === 'color')    root.style.background = value;
  if (type === 'gradient') root.style.background = value;
  if (type === 'image') {
    root.style.background = `url(${API_URL}${value}) center/cover fixed no-repeat`;
  }
}

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [filterText, setFilterText] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const { onlineUsers } = useBoardSocket(boardId);
  const { data: me } = useMe();

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', boardId],
    queryFn: () => boardsApi.get(boardId),
    enabled: !!boardId,
  });

  const isOwner = !!me && !!board && me.id === board.ownerId;

  useEffect(() => {
    if (!board) return;
    applyBackground(board.coverType, board.coverValue);
    return () => applyBackground(null, null);
  }, [board?.coverType, board?.coverValue]);

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

  const hasCover = !!board.coverType && !!board.coverValue;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 flex-wrap">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-1.5 text-atomic-gray-500 hover:text-atomic-dark hover:bg-white/60 rounded-lg transition-colors"
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
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], zIndex: 10 - i }}
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

        {/* Aparência do board */}
        <BoardCoverPicker
          boardId={boardId}
          isOwner={isOwner}
          hasCover={hasCover}
        />

        {/* Botão Membros */}
        <button
          onClick={() => setShowMembers(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-atomic-gray-600 hover:text-atomic-dark border border-atomic-gray-300/50 hover:border-atomic-gray-300 bg-white/70 hover:bg-white rounded-lg transition-all"
        >
          <Users size={14} />
          <span className="hidden xs:inline">Membros</span>
        </button>

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
        {showMembers && me && (
          <BoardMembersPanel
            key="members-panel"
            boardId={boardId}
            currentUserId={me.id}
            isOwner={isOwner}
            onClose={() => setShowMembers(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
