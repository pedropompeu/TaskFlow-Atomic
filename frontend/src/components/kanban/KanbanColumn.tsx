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
      <div className={cn('bg-brand-surface rounded-t-xl border border-b-0 border-brand-border-subtle border-t-[3px] px-3 pt-3 pb-2.5', accent)}>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.07em] text-brand-text-muted">{title}</h3>
          <span className="min-w-[20px] h-[18px] flex items-center justify-center text-[11px] font-bold tabular-nums bg-brand-surface-elevated text-brand-text-muted px-1.5 rounded-full">
            {cards.length}
          </span>
        </div>

        {/* Barra de progresso WIP */}
        <div className="h-1 bg-brand-border-subtle rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${progress}%`,
              background: progress >= 100
                ? '#7499BF'
                : progress >= 60
                ? '#C9A870'
                : '#4A8C6F',
            }}
          />
        </div>
      </div>

      {/* ── Cards container ── */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 min-h-[140px] bg-brand-subtle rounded-b-xl border border-brand-border-subtle p-2 space-y-2',
          'transition-all duration-150',
          isOver && 'bg-brand-accent-muted/50 border-brand-accent/60',
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
              transition={{ duration: 0.25 }}
              className="flex items-center justify-center h-20"
            >
              <span className="text-[11px] text-brand-text-muted/40 select-none tracking-wide">· · ·</span>
            </motion.div>
          )}
        </AnimatePresence>

        <CreateCardForm onSubmit={onCreateCard} isLoading={isCreating} />
      </div>

    </div>
  );
}
