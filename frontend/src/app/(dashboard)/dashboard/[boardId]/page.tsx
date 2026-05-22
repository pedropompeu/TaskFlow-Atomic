'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
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
        <div className="h-8 w-48 bg-gray-200 rounded" />
        <div className="flex gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="w-72 h-96 bg-gray-100 rounded-xl shrink-0" />
          ))}
        </div>
      </div>
    );
  }

  if (!board) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Board not found.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push('/dashboard')}
          className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Back to boards"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{board.title}</h2>
          {board.description && (
            <p className="text-sm text-gray-500 mt-0.5">{board.description}</p>
          )}
        </div>
      </div>

      {/* Kanban */}
      <KanbanBoard
        boardId={boardId}
        onEditCard={(card) => setEditingCard(card)}
      />

      {/* Edit modal placeholder — replaced by full modal in Task 6 */}
      {editingCard && (
        <div
          className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
          onClick={() => setEditingCard(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold text-gray-900 mb-2">{editingCard.title}</h3>
            <p className="text-sm text-gray-500 mb-4">
              {editingCard.description ?? 'No description.'}
            </p>
            <p className="text-xs text-gray-400 italic">
              Full edit modal coming in Task 6.
            </p>
            <button
              onClick={() => setEditingCard(null)}
              className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
