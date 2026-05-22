'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import { CreateCardForm } from './CreateCardForm';
import type { Card, CardStatus } from '@/types';

interface KanbanColumnProps {
  status: CardStatus;
  title: string;
  accent: string;
  cards: Card[];
  onCreateCard: (title: string) => void;
  onDeleteCard: (id: string) => void;
  onEditCard: (card: Card) => void;
  isCreating: boolean;
}

export function KanbanColumn({
  status,
  title,
  accent,
  cards,
  onCreateCard,
  onDeleteCard,
  onEditCard,
  isCreating,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-72 shrink-0">
      {/* Column header */}
      <div
        className={cn(
          'bg-white rounded-t-xl border border-b-0 border-gray-200 border-t-4 px-3 py-2.5',
          accent,
        )}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700">{title}</h3>
          <span className="text-xs bg-gray-100 text-gray-500 font-medium px-1.5 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] bg-gray-50 rounded-b-xl border border-gray-200 p-2 space-y-2 transition-colors',
          isOver && 'bg-blue-50 border-blue-300',
        )}
      >
        <SortableContext
          items={cards.map((c) => c.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onDelete={onDeleteCard}
              onEdit={onEditCard}
            />
          ))}
        </SortableContext>

        <CreateCardForm onSubmit={onCreateCard} isLoading={isCreating} />
      </div>
    </div>
  );
}
