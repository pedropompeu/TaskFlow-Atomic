'use client';

import { motion } from 'framer-motion';
import { Trash2, RotateCcw, X, Clock } from 'lucide-react';
import { formatDistanceToNow, parseISO, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useTrash, useRestoreCard } from '@/hooks/useCards';

interface TrashPanelProps {
  boardId: string;
  onClose: () => void;
}

const TRASH_TTL_DAYS = 7;

function daysUntilPurge(deletedAt: string): number {
  const deleted = parseISO(deletedAt);
  const elapsed = differenceInDays(new Date(), deleted);
  return Math.max(0, TRASH_TTL_DAYS - elapsed);
}

export function TrashPanel({ boardId, onClose }: TrashPanelProps) {
  const { data: trashed = [], isLoading } = useTrash(boardId);
  const restore = useRestoreCard(boardId);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-start justify-center p-4 pt-14 overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className="bg-brand-surface-elevated border border-brand-border rounded-2xl shadow-brand-modal w-full max-w-lg mb-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 pt-5 pb-4 border-b border-brand-border-subtle">
          <Trash2 size={18} className="text-brand-text-muted shrink-0" />
          <div className="flex-1">
            <h3 className="text-base font-bold text-brand-text-primary">Lixeira</h3>
            <p className="text-xs text-brand-text-muted mt-0.5">
              Cards excluídos são apagados permanentemente após 7 dias
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-brand-text-muted hover:text-brand-text-primary hover:bg-brand-surface rounded-lg transition-colors"
            aria-label="Fechar lixeira"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-brand-surface rounded-xl animate-pulse" />
              ))}
            </div>
          ) : trashed.length === 0 ? (
            <div className="text-center py-12 text-brand-text-muted">
              <Trash2 size={32} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Lixeira vazia</p>
            </div>
          ) : (
            <div className="space-y-2">
              {trashed.map((card) => {
                const remaining = daysUntilPurge(card.deletedAt!);
                return (
                  <div
                    key={card.id}
                    className="flex items-center gap-3 p-3 bg-brand-surface rounded-xl border border-brand-border-subtle hover:border-brand-border transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-text-primary truncate">
                        {card.title}
                      </p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Clock size={11} className="text-brand-text-muted shrink-0" />
                        <span className="text-xs text-brand-text-muted">
                          Excluído{' '}
                          {formatDistanceToNow(parseISO(card.deletedAt!), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                        <span className="text-xs text-brand-border-strong mx-1">·</span>
                        <span className={`text-xs font-medium ${remaining <= 1 ? 'text-brand-error' : 'text-brand-text-muted'}`}>
                          {remaining === 0
                            ? 'Apaga hoje'
                            : `Apaga em ${remaining} dia${remaining !== 1 ? 's' : ''}`}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => restore.mutate(card.id)}
                      disabled={restore.isPending}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-brand-accent bg-brand-accent-muted/30 hover:bg-brand-accent-muted/50 border border-brand-accent/30 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                      aria-label={`Restaurar ${card.title}`}
                    >
                      <RotateCcw size={11} />
                      Restaurar
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
