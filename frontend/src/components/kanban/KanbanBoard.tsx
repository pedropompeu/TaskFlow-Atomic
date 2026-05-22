'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useState } from 'react';
import { KanbanColumn } from './KanbanColumn';
import { KanbanCard } from './KanbanCard';
import { useCards, useCreateCard, useUpdateCard, useDeleteCard, useReorderCards } from '@/hooks/useCards';
import { COLUMN_CONFIG, type Card, type CardStatus } from '@/types';

interface KanbanBoardProps {
  boardId: string;
  onEditCard: (card: Card) => void;
  filterText?: string;
}

export function KanbanBoard({ boardId, onEditCard, filterText = '' }: KanbanBoardProps) {
  const { data: cards = [] } = useCards(boardId);
  const createCard = useCreateCard(boardId);
  const updateCard = useUpdateCard(boardId);
  const deleteCard = useDeleteCard(boardId);
  const reorderCards = useReorderCards(boardId);
  const [activeCard, setActiveCard] = useState<Card | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
  );

  const needle = filterText.toLowerCase();
  const visibleCards = needle
    ? cards.filter((c) => c.title.toLowerCase().includes(needle))
    : cards;

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
    const newIndex = columnCards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

    const reordered = arrayMove(columnCards, oldIndex, newIndex);
    reorderCards.mutate(reordered.map((c) => c.id));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
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
            onDeleteCard={(id) => deleteCard.mutate(id)}
            onEditCard={onEditCard}
          />
        ))}
      </div>

      {/* Ghost card shown while dragging */}
      <DragOverlay>
        {activeCard && (
          <div className="rotate-2 opacity-90">
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
