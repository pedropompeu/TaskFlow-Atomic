'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';

interface CreateCardFormProps {
  onSubmit: (title: string) => void;
  isLoading: boolean;
}

export function CreateCardForm({ onSubmit, isLoading }: CreateCardFormProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setTitle('');
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-1.5 text-sm text-brand-text-muted hover:text-brand-text-secondary hover:bg-brand-surface rounded-lg px-2 py-2 transition-colors mt-1"
      >
        <Plus size={15} />
        Adicionar card
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-2 space-y-2">
      <textarea
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
          }
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder="Título do card…"
        rows={2}
        className="w-full px-3 py-2 text-sm bg-brand-surface border border-brand-accent/40 rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="px-3 py-1.5 bg-brand-accent text-brand-accent-fg text-sm font-medium rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Adicionando…' : 'Adicionar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 text-brand-text-muted hover:text-brand-text-secondary transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </form>
  );
}
