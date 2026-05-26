'use client';

import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
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
  // Optimistic local card order — active only while dragging
  const [localCards, setLocalCards] = useState<Record<CardStatus, Card[]> | null>(null);

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

  // Columns use local optimistic state while dragging, server state otherwise
  const displayByStatus = localCards ?? byStatus;

  const allColumns = COLUMN_CONFIG.map((c) => c.status as string);

  function handleDragStart({ active }: { active: { id: string | number } }) {
    const card = cards.find((c) => c.id === active.id);
    if (card) {
      setActiveCard(card);
      setLocalCards({ ...byStatus });
    }
  }

  function handleDragOver({ active, over }: DragOverEvent) {
    if (!over || !localCards) return;

    const activeId = active.id as string;
    const overId = over.id as string;
    if (activeId === overId) return;

    // Find which column holds the dragged card in the current local state
    const activeCol = (Object.keys(localCards) as CardStatus[]).find((col) =>
      localCards[col].some((c) => c.id === activeId),
    );
    if (!activeCol) return;

    // Determine the target column (either a column id or the column of the hovered card)
    const isOverCol = allColumns.includes(overId);
    const overCol: CardStatus = isOverCol
      ? (overId as CardStatus)
      : ((Object.keys(localCards) as CardStatus[]).find((col) =>
          localCards[col].some((c) => c.id === overId),
        ) ?? activeCol);

    // Same column → SortableContext handles the visual; nothing to do here
    if (activeCol === overCol) return;

    setLocalCards((prev) => {
      if (!prev) return prev;
      const moving = prev[activeCol].find((c) => c.id === activeId);
      if (!moving) return prev;

      const newSource = prev[activeCol].filter((c) => c.id !== activeId);
      const newTarget = [...prev[overCol]];

      // Insert before the hovered card; append when hovering the column itself
      const overIndex = newTarget.findIndex((c) => c.id === overId);
      const insertAt = overIndex >= 0 ? overIndex : newTarget.length;
      newTarget.splice(insertAt, 0, { ...moving, status: overCol });

      return { ...prev, [activeCol]: newSource, [overCol]: newTarget };
    });
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveCard(null);

    if (!over || !localCards) {
      setLocalCards(null);
      return;
    }

    const draggedCard = cards.find((c) => c.id === active.id);
    if (!draggedCard) {
      setLocalCards(null);
      return;
    }

    // Where did the card land in the local optimistic state?
    const finalCol = (Object.keys(localCards) as CardStatus[]).find((col) =>
      localCards[col].some((c) => c.id === active.id),
    ) as CardStatus | undefined;

    if (finalCol && finalCol !== draggedCard.status) {
      // Cross-column: keep local state visible until the cache is updated to avoid flicker.
      // setLocalCards(null) is deferred to onSettled so byStatus already reflects the new
      // status (from useUpdateCard's onMutate) by the time the component re-renders.
      updateCard.mutate(
        { id: draggedCard.id, status: finalCol },
        { onSettled: () => setLocalCards(null) },
      );
      reorderCards.mutate(localCards[finalCol].map((c) => c.id));
      return;
    }

    // Same-column reorder (SortableContext gave us the correct over.id)
    if (active.id !== over.id) {
      const isColTarget = allColumns.includes(over.id as string);
      const colCards = byStatus[draggedCard.status];
      const oldIdx = colCards.findIndex((c) => c.id === active.id);
      const newIdx = isColTarget
        ? colCards.length - 1
        : colCards.findIndex((c) => c.id === over.id);

      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        reorderCards.mutate(arrayMove(colCards, oldIdx, newIdx).map((c) => c.id));
      }
    }

    setLocalCards(null);
  }

  function handleDragCancel() {
    setActiveCard(null);
    setLocalCards(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={kanbanCollision}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex gap-4 overflow-x-auto pb-6 pt-2 snap-x snap-mandatory md:snap-none scroll-smooth -mx-2 px-2"  style={{ WebkitOverflowScrolling: 'touch' }}>
        {COLUMN_CONFIG.map((col) => (
          <KanbanColumn
            key={col.status}
            status={col.status}
            title={col.title}
            accent={col.accent}
            cards={displayByStatus[col.status]}
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
          className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
          onClick={() => setPendingDeleteId(null)}
        >
          <div
            className="bg-brand-surface-elevated border border-brand-border rounded-2xl shadow-brand-modal w-full max-w-sm p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-brand-error-subtle flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-brand-error" />
              </div>
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">Excluir card?</h3>
                <p className="text-sm text-brand-text-secondary mt-1">
                  O card ficará na lixeira por 7 dias antes de ser apagado permanentemente.
                </p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-brand-text-secondary bg-brand-surface hover:bg-brand-surface-elevated rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  deleteCard.mutate(pendingDeleteId);
                  setPendingDeleteId(null);
                }}
                disabled={deleteCard.isPending}
                className="px-4 py-2 text-sm font-medium text-brand-error-fg bg-brand-error-subtle hover:bg-[var(--primitive-red-600)] rounded-lg transition-colors disabled:opacity-50"
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
