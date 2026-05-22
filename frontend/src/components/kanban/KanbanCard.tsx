'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Trash2, Calendar, User as UserIcon } from 'lucide-react';
import { formatDistanceToNow, isPast, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { Card } from '@/types';
import { PRIORITY_META } from '@/types';

interface KanbanCardProps {
  card: Card;
  onDelete: (id: string) => void;
  onEdit: (card: Card) => void;
}

export function KanbanCard({ card, onDelete, onEdit }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isOverdue =
    card.dueDate && isPast(parseISO(card.dueDate)) && card.status !== 'done';

  const priority = PRIORITY_META[card.priority];

  const isDone = card.status === 'done';

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group bg-white rounded-lg border p-3 shadow-sm cursor-grab active:cursor-grabbing',
        'transition-all duration-200',
        'animate-card-enter',
        isDone
          ? 'border-atomic-green/40 shadow-[0_0_12px_rgba(67,172,141,0.12)]'
          : 'border-atomic-gray-300/40 hover:border-atomic-orange/40 hover:shadow-[0_4px_16px_rgba(247,142,47,0.12)] hover:-translate-y-0.5',
        isDragging && 'opacity-50 scale-[1.03] rotate-1 shadow-xl border-atomic-orange/50 z-50',
      )}
      {...attributes}
      {...listeners}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span
          className={cn(
            'text-xs font-medium px-1.5 py-0.5 rounded',
            priority.classes,
          )}
        >
          {priority.label}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 text-atomic-gray-500 hover:text-red-500 transition-opacity shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onDelete(card.id);
          }}
          aria-label="Excluir card"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Title — click opens modal */}
      <p
        className="text-sm font-medium text-atomic-dark mb-2 leading-snug cursor-pointer hover:text-atomic-orange transition-colors"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onEdit(card);
        }}
      >
        {card.title}
      </p>

      {/* Tags */}
      {card.tags && card.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {card.tags.map((tag) => (
            <span
              key={tag.id}
              className="text-xs px-1.5 py-0.5 rounded-full text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 mt-2">
        {card.dueDate && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs',
              isOverdue ? 'text-red-600 font-medium' : 'text-atomic-gray-500',
            )}
          >
            <Calendar size={11} />
            {formatDistanceToNow(parseISO(card.dueDate), { addSuffix: true, locale: ptBR })}
          </span>
        )}
        {card.assignedTo && (
          <span className="flex items-center gap-1 text-xs text-atomic-gray-500 ml-auto">
            <UserIcon size={11} />
            {card.assignedTo.name.split(' ')[0]}
          </span>
        )}
      </div>
    </div>
  );
}
