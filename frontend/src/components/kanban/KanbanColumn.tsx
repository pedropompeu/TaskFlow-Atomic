'use client';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { KanbanCard } from './KanbanCard';
import { CreateCardForm } from './CreateCardForm';
import type { Card, CardStatus } from '@/types';

const WIP_LIMIT = 8;

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
  const progress = Math.min((cards.length / WIP_LIMIT) * 100, 100);
  const isEmpty = cards.length === 0;

  return (
    <div className="flex flex-col w-72 shrink-0 snap-start">

      {/* ── Header ── */}
      <div className={cn('bg-white/95 backdrop-blur-sm rounded-t-xl border border-b-0 border-atomic-gray-300/30 border-t-4 px-3 pt-2.5 pb-2 shadow-sm', accent)}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-atomic-dark/80">{title}</h3>
          <span className="text-xs bg-atomic-ice text-atomic-gray-500 font-medium px-1.5 py-0.5 rounded-full">
            {cards.length}
          </span>
        </div>

        {/* Barra de progresso WIP */}
        <div className="h-1 bg-atomic-gray-300/30 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: progress >= 100
                ? '#A559FD'
                : progress >= 60
                ? '#F78E2F'
                : '#43AC8D',
            }}
          />
        </div>
      </div>

      {/* ── Cards container ── */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[120px] bg-white/70 backdrop-blur-sm rounded-b-xl border border-atomic-gray-300/30 p-2 space-y-2 shadow-sm',
          'transition-all duration-200',
          isOver && 'bg-atomic-orange/10 border-atomic-orange/50 shadow-[inset_0_0_20px_rgba(247,142,47,0.10)]',
        )}
      >
        <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence initial={false}>
            {cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onDelete={onDeleteCard}
                onEdit={onEditCard}
              />
            ))}
          </AnimatePresence>
        </SortableContext>

        {/* Estado vazio — respira suavemente */}
        <AnimatePresence>
          {isEmpty && !isOver && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-center justify-center h-16 animate-column-breathe"
            >
              <span className="text-xs text-atomic-gray-500/60 select-none">solte aqui</span>
            </motion.div>
          )}
        </AnimatePresence>

        <CreateCardForm onSubmit={onCreateCard} isLoading={isCreating} />
      </div>

    </div>
  );
}
