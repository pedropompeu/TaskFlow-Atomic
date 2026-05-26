'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
import { Trash2, Calendar } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Card } from '@/types';
import { PRIORITY_META } from '@/types';

const AVATAR_COLORS = ['#F78E2F', '#A559FD', '#43AC8D', '#1D84B7', '#FDCC32'];


interface KanbanCardProps {
  card: Card;
  onDelete: (id: string) => void;
  onEdit: (card: Card) => void;
}

export function KanbanCard({ card, onDelete, onEdit }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isDone    = card.status === 'done';
  const priority  = PRIORITY_META[card.priority] ?? PRIORITY_META.medium;
  const due       = card.dueDate ? parseISO(card.dueDate) : null;
  const isOverdue = due && isPast(due) && !isDone;
  const isNearDue = due && !isPast(due) && differenceInHours(due, new Date()) < 48 && !isDone;

  if (isDragging) {
    return (
      <div
        ref={setNodeRef}
        style={dndStyle}
        {...attributes}
        {...listeners}
        className="rounded-lg border-2 border-dashed border-brand-accent/40 bg-brand-accent-muted/20 min-h-[80px]"
      />
    );
  }

  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{
        opacity: isDragging ? 0.45 : 1,
        y:       0,
        scale:   isDragging ? 1.04 : 1,
        rotate:  isDragging ? 2    : 0,
        boxShadow: isDragging
          ? '0 20px 40px rgba(0,0,0,0.55), 0 8px 16px rgba(0,0,0,0.4)'
          : isDone
          ? '0 2px 10px rgba(74,140,111,0.18), 0 1px 3px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
          : '0 1px 2px rgba(0,0,0,0.38), 0 2px 6px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
        zIndex: isDragging ? 50 : 'auto',
      }}
      transition={{
        layout:  { type: 'spring', stiffness: 300, damping: 28 },
        opacity: { duration: 0.15 },
        scale:   { type: 'spring', stiffness: 320, damping: 22 },
        rotate:  { type: 'spring', stiffness: 300, damping: 20 },
      }}
      style={{ borderLeftColor: isDone ? '#4A8C6F' : (card.accentColor ?? priority.accent), ...dndStyle }}
      className={cn(
        'group relative bg-brand-surface rounded-xl border border-l-[3px] px-3 pt-3 pb-2.5 cursor-grab active:cursor-grabbing transition-colors duration-150',
        isDone
          ? 'border-brand-success/40 hover:bg-brand-surface-elevated'
          : 'border-brand-border-subtle hover:border-brand-border hover:bg-brand-surface-elevated',
      )}
      {...attributes}
      {...listeners}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-md tracking-wide', priority.classes)}>
          {priority.label}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 text-brand-text-muted hover:text-brand-error transition-opacity shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
          aria-label="Excluir card"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Title */}
      <p
        className="text-sm font-medium text-brand-text-primary mb-2.5 leading-snug cursor-pointer hover:text-brand-accent transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onEdit(card); }}
      >
        {card.title}
      </p>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full tracking-wide"
              style={{
                backgroundColor: `${tag.color}1A`,
                color: tag.color,
                border: `1px solid ${tag.color}40`,
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-2">
        {due && (
          <span className={cn(
            'flex items-center gap-1 text-xs font-medium',
            isOverdue ? 'bg-brand-error-subtle text-brand-error-fg rounded px-1.5 py-0.5' :
            isNearDue ? 'bg-brand-warning-subtle text-brand-warning-fg rounded px-1.5 py-0.5' :
                        'text-brand-text-muted',
          )}>
            <Calendar size={11} />
            {formatDistanceToNow(due, { addSuffix: true, locale: ptBR })}
          </span>
        )}
        {card.assignees && card.assignees.length > 0 && (
          <div className="flex items-center -space-x-1.5 ml-auto">
            {card.assignees.slice(0, 3).map((u, i) => (
              <div
                key={u.id}
                title={u.name}
                style={{ backgroundColor: AVATAR_COLORS[i % AVATAR_COLORS.length], zIndex: 3 - i }}
                className="relative w-5 h-5 rounded-full border border-brand-border flex items-center justify-center text-[9px] font-bold text-white"
              >
                {u.name.charAt(0).toUpperCase()}
              </div>
            ))}
            {card.assignees.length > 3 && (
              <div
                style={{ zIndex: 0 }}
                className="relative w-5 h-5 rounded-full border border-brand-border bg-brand-text-muted flex items-center justify-center text-[9px] font-bold text-white"
              >
                +{card.assignees.length - 3}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
