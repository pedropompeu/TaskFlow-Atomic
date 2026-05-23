'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCenter,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useCards, useCreateCard, useUpdateCard, useDeleteCard, useReorderCards } from '@/hooks/useCards';
import { COLUMN_CONFIG, type Card, type CardStatus } from '@/types';

// Cursor-first collision: reacts to pointer position rather than drag-item bounding box.
// Makes insertion-point detection much more responsive in vertical lists.
const kanbanCollision: CollisionDetection = (args) => {
  const hits = pointerWithin(args);
  return hits.length > 0 ? hits : closestCenter(args);
};

interface KanbanBoardProps {
  boardId: string;
  onEditCard: (card: Card) => void;
  filterText?: string;
  filterUserId?: string;
}

export function KanbanBoard({ boardId, onEditCard, filterText = '', filterUserId = '' }: KanbanBoardProps) {
  const { data: rawCards = [] } = useCards(boardId);
  const cards = useMemo(() => {
    const map = new Map<string, Card>();
    for (const c of rawCards) if (!map.has(c.id)) map.set(c.id, c);
    return Array.from(map.values());
  }, [rawCards]);
  const createCard = useCreateCard(boardId);
  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const reorderCards = useReorderCards(boardId);
  const [activeCard, setActiveCard] = useState<Card | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const needle = filterText.toLowerCase();
  const visibleCards = cards.filter((c) => {
    if (needle) {
      const matchesTitle    = c.title.toLowerCase().includes(needle);
      const matchesAssignee = c.assignees?.some((a) =>
        a.name.toLowerCase().includes(needle),
      );
      if (!matchesTitle && !matchesAssignee) return false;
    }
    if (filterUserId === '__none__') {
      return (!c.assignees || c.assignees.length === 0) && !c.assignedToId;
    }
    if (filterUserId) {
      return (
        c.assignees?.some((a) => a.id === filterUserId) ||
        c.assignedToId === filterUserId ||
        c.assignedTo?.id === filterUserId
      );
    }
    return true;
  });

  const byStatus = COLUMN_CONFIG.reduce(
    (acc, col) => {
      acc[col.status] = visibleCards
        .filter((c) => c.status === col.status)
        .sort((a, b) => a.position - b.position);
      return acc;
    },
    {} as Record<CardStatus, Card[]>,
  );

  function handleDragStart({ active }: { active: { id: string | number } }) {
    const card = cards.find((c) => c.id === active.id);
    if (card) setActiveCard(card);
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);
    if (!over || active.id === over.id) return;

    const draggedCard = cards.find((c) => c.id === active.id);
    if (!draggedCard) return;

    const isColumnTarget = COLUMN_CONFIG.some((col) => col.status === over.id);
    const targetStatus: CardStatus = isColumnTarget
      ? (over.id as CardStatus)
      : (cards.find((c) => c.id === over.id)?.status ?? draggedCard.status);

    if (targetStatus !== draggedCard.status) {
      updateCard.mutate({ id: draggedCard.id, status: targetStatus });
      return;
    }

    // Same-column: reorder vertically
    const columnCards = byStatus[draggedCard.status];
    const oldIndex = columnCards.findIndex((c) => c.id === active.id);
    // Drop on column area (not a card) → move to last position
    const newIndex = isColumnTarget
      ? columnCards.length - 1
      : columnCards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(columnCards, oldIndex, newIndex);
    reorderCards.mutate(reordered.map((c) => c.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollision}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory md:snap-none scroll-smooth -mx-2 px-2"  style={{ WebkitOverflowScrolling: 'touch' }}>
        {COLUMN_CONFIG.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            accent={col.accent}
            cards={byStatus[col.status]}
            isCreating={createCard.isPending}
            onCreateCard={(title) =>
              createCard.mutate({ title, status: col.status })
            }
            onDeleteCard={(id) => setPendingDeleteId(id)}
            onEditCard={onEditCard}
          />
        ))}
      </div>

      {/* Dialog de confirmação de exclusão */}
      {pendingDeleteId && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Excluir card?</h3>
                <p className="text-sm text-stone-500 mt-1">
                  O card ficará na lixeira por 7 dias antes de ser apagado permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteCard.mutate(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
                disabled={deleteCard.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card flutuante durante o arrasto */}
      <DragOverlay dropAnimation={{ duration: 180, easing: 'ease' }}>
        {activeCard && (
          <div className="rotate-2 scale-105 opacity-95 drop-shadow-2xl">
            <KanbanCard
              card={activeCard}
              onDelete={() => {}}
              onEdit={() => {}}
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
