'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ArrowLeft, Search, X, Users, Trash2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardEditModal } from '@/components/kanban/CardEditModal';
import { BoardMembersPanel } from '@/components/kanban/BoardMembersPanel';
import { TrashPanel } from '@/components/kanban/TrashPanel';
import { BoardCoverPicker } from '@/components/kanban/BoardCoverPicker';
import { boardsApi } from '@/lib/boards';
import { useTrash } from '@/hooks/useCards';
import { useBoardSocket } from '@/hooks/useBoardSocket';
import { useMe } from '@/hooks/useMe';
import { useMembers } from '@/hooks/useMembers';
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
  const [filterUserId, setFilterUserId] = useState('');
  const [showMembers, setShowMembers] = useState(false);
  const [showTrash, setShowTrash] = useState(false);
  const { data: trashed = [] } = useTrash(boardId);
  const { onlineUsers } = useBoardSocket(boardId);
  const { data: me } = useMe();
  const { data: members } = useMembers(boardId);

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
        <div className="h-8 w-48 bg-brand-surface rounded" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 h-96 bg-brand-subtle rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-20 text-brand-text-muted">
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
          className="p-1.5 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface rounded-lg transition-colors"
          aria-label="Voltar aos quadros"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-brand-text-primary">{board.title}</h2>
          {board.description && (
            <p className="text-sm text-brand-text-secondary mt-0.5">{board.description}</p>
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
                className="relative w-7 h-7 rounded-full border-2 border-brand-bg flex items-center justify-center text-[11px] font-bold text-white"
              >
                {u.userName.charAt(0).toUpperCase()}
              </div>
            ))}
            {onlineUsers.length > 5 && (
              <div
                style={{ zIndex: 5 }}
                className="relative w-7 h-7 rounded-full border-2 border-brand-bg bg-brand-text-muted flex items-center justify-center text-[11px] font-bold text-white"
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

        {/* Botão Lixeira */}
        <button
          onClick={() => setShowTrash(true)}
          className="relative flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-text-secondary hover:text-brand-text-primary border border-brand-border-subtle hover:border-brand-border bg-brand-surface hover:bg-brand-surface-elevated rounded-lg transition-all"
          aria-label="Lixeira"
        >
          <Trash2 size={14} />
          <span className="hidden xs:inline">Lixeira</span>
          {trashed.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-brand-error text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {trashed.length > 9 ? '9+' : trashed.length}
            </span>
          )}
        </button>

        {/* Botão Membros */}
        <button
          onClick={() => setShowMembers(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-brand-text-secondary hover:text-brand-text-primary border border-brand-border-subtle hover:border-brand-border bg-brand-surface hover:bg-brand-surface-elevated rounded-lg transition-all"
        >
          <Users size={14} />
          <span className="hidden xs:inline">Membros</span>
        </button>

        {/* Filtro por usuário */}
        {members && (
          <select
            value={filterUserId}
            onChange={(e) => setFilterUserId(e.target.value)}
            className="px-2.5 py-1.5 text-sm border border-brand-border-subtle rounded-lg bg-brand-surface focus:outline-none focus:border-brand-accent text-brand-text-secondary transition-all"
          >
            <option value="">Todos</option>
            <option value="__none__">Sem responsável</option>
            {[members.owner, ...members.members].map((m) => (
              <option key={m.id} value={m.id}>{m.name.split(' ')[0]}</option>
            ))}
          </select>
        )}

        {/* Busca */}
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-text-muted pointer-events-none" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filtrar cards…"
            className="pl-8 pr-7 py-1.5 text-sm border border-brand-border-subtle rounded-lg bg-brand-surface text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent w-44 transition-all focus:w-56"
          />
          {filterText && (
            <button
              onClick={() => setFilterText('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-text-primary"
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
        filterUserId={filterUserId}
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
        {showTrash && (
          <TrashPanel
            key="trash-panel"
            boardId={boardId}
            onClose={() => setShowTrash(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
