'use client';

import { useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { useBoardTags } from '@/hooks/useBoardTags';
import { cn } from '@/lib/utils';
import type { BoardTag, CardTag } from '@/types';

interface TagPickerPanelProps {
  boardId: string;
  cardTags: CardTag[];
  onAdd: (name: string, color: string) => void;
  onRemove: (tagId: string) => void;
  onClose: () => void;
  isPending?: boolean;
}

const PRESET_COLORS = [
  '#527DA3', '#7499BF', '#A8BDD4',
  '#4A8C6F', '#7DC4A0', '#C9A870',
  '#C47070', '#8C4A4A', '#A559FD',
  '#FDCC32', '#4E5A6B', '#F78E2F',
];

export function TagPickerPanel({
  boardId,
  cardTags,
  onAdd,
  onRemove,
  onClose,
  isPending,
}: TagPickerPanelProps) {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#527DA3');
  const { data: boardTags = [] } = useBoardTags(boardId);

  // Map de name|color → cardTag para checar quais já estão no card
  const cardTagMap = new Map(cardTags.map((t) => [`${t.name}|${t.color}`, t]));

  function handleToggle(bt: BoardTag) {
    const existing = cardTagMap.get(`${bt.name}|${bt.color}`);
    if (existing) {
      onRemove(existing.id);
    } else {
      onAdd(bt.name, bt.color);
    }
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    onAdd(name, newColor);
    setNewName('');
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => { e.stopPropagation(); onClose(); }}
    >
      <div
        className="bg-brand-surface-elevated border border-brand-border rounded-xl shadow-brand-modal w-full max-w-xs p-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h5 className="text-sm font-semibold text-brand-text-primary">Tags do Board</h5>
          <button
            onClick={onClose}
            className="p-1 text-brand-text-muted hover:text-brand-text-primary rounded transition-colors"
          >
            <X size={14} />
          </button>
        </div>

        {/* Catálogo de tags do board */}
        {boardTags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {boardTags.map((bt) => {
              const active = !!cardTagMap.get(`${bt.name}|${bt.color}`);
              return (
                <button
                  key={bt.id}
                  onClick={() => handleToggle(bt)}
                  disabled={isPending}
                  title={active ? `Remover "${bt.name}"` : `Adicionar "${bt.name}"`}
                  className={cn(
                    'flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full transition-all disabled:opacity-50',
                    active ? 'opacity-100' : 'opacity-70 hover:opacity-100',
                  )}
                  style={{
                    backgroundColor: active ? `${bt.color}30` : `${bt.color}14`,
                    color: bt.color,
                    border: `1px solid ${active ? bt.color + '80' : bt.color + '40'}`,
                  }}
                >
                  {active && <Check size={9} strokeWidth={3} />}
                  {bt.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-brand-text-muted text-center py-2 mb-3">
            Nenhuma tag no catálogo ainda
          </p>
        )}

        {/* Criar nova tag */}
        <div className="border-t border-brand-border-subtle pt-3">
          <p className="text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider mb-2">
            Nova tag
          </p>

          {/* Presets de cor */}
          <div className="flex flex-wrap gap-1 mb-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className={cn(
                  'w-5 h-5 rounded-full transition-all hover:scale-110',
                  newColor === c && 'ring-2 ring-offset-1 ring-offset-brand-surface-elevated ring-white/70 scale-110',
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>

          <div className="flex gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Nome da tag…"
              autoFocus
              className="flex-1 px-2.5 py-1.5 text-xs bg-brand-surface border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent"
            />
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="w-8 h-8 rounded border border-brand-border cursor-pointer p-0.5 bg-brand-surface"
              title="Cor personalizada"
            />
            <button
              onClick={handleCreate}
              disabled={!newName.trim() || isPending}
              className="p-1.5 bg-brand-accent text-brand-accent-fg rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
              aria-label="Criar e adicionar tag"
            >
              <Plus size={14} />
            </button>
          </div>

          {/* Preview da nova tag */}
          {newName.trim() && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="text-[11px] text-brand-text-muted">Preview:</span>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${newColor}1A`,
                  color: newColor,
                  border: `1px solid ${newColor}40`,
                }}
              >
                {newName.trim()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
