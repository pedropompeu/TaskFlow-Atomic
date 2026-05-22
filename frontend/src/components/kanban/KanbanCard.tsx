'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion } from 'framer-motion';
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

  const dndStyle = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  const isOverdue = card.dueDate && isPast(parseISO(card.dueDate)) && card.status !== 'done';
  const isDone    = card.status === 'done';
  const priority  = PRIORITY_META[card.priority];

  return (
    <motion.div
      ref={setNodeRef}
      style={dndStyle}
      layout
      initial={{ opacity: 0, y: 10, scale: 0.96 }}
      animate={{
        opacity: isDragging ? 0.45 : 1,
        y:       0,
        scale:   isDragging ? 1.04 : 1,
        rotate:  isDragging ? 2    : 0,
        boxShadow: isDragging
          ? '0 20px 40px rgba(0,0,0,0.18)'
          : isDone
          ? '0 0 12px rgba(67,172,141,0.15)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        zIndex: isDragging ? 50 : 'auto',
      }}
      exit={{ opacity: 0, x: 40, scale: 0.92 }}
      transition={{
        layout:  { type: 'spring', stiffness: 300, damping: 28 },
        opacity: { duration: 0.15 },
        scale:   { type: 'spring', stiffness: 320, damping: 22 },
        rotate:  { type: 'spring', stiffness: 300, damping: 20 },
      }}
      className={cn(
        'group bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing',
        isDone
          ? 'border-atomic-green/40'
          : 'border-atomic-gray-300/40 hover:border-atomic-orange/40',
      )}
      {...attributes}
      {...listeners}
    >
      {/* Priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className={cn('text-xs font-medium px-1.5 py-0.5 rounded', priority.classes)}>
          {priority.label}
        </span>
        <button
          className="opacity-0 group-hover:opacity-100 text-atomic-gray-500 hover:text-red-500 transition-opacity shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onDelete(card.id); }}
          aria-label="Excluir card"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Title */}
      <p
        className="text-sm font-medium text-atomic-dark mb-2 leading-snug cursor-pointer hover:text-atomic-orange transition-colors"
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
        {card.dueDate && (
          <span className={cn('flex items-center gap-1 text-xs', isOverdue ? 'text-red-600 font-medium' : 'text-atomic-gray-500')}>
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
    </motion.div>
  );
}
