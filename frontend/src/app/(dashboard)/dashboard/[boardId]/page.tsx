'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { CardEditModal } from '@/components/kanban/CardEditModal';
import { boardsApi } from '@/lib/boards';
import type { Card } from '@/types';

export default function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>();
  const router = useRouter();
  const [editingCard, setEditingCard] = useState<Card | null>(null);

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
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-lg transition-colors"
          aria-label="Voltar aos quadros"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-stone-900">{board.title}</h2>
          {board.description && (
            <p className="text-sm text-stone-500 mt-0.5">{board.description}</p>
          )}
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard
        boardId={boardId}
        onEditCard={(card) => setEditingCard(card)}
      />

      {editingCard && (
        <CardEditModal
          card={editingCard}
          boardId={boardId}
          onClose={() => setEditingCard(null)}
        />
      )}
    </div>
  );
}
