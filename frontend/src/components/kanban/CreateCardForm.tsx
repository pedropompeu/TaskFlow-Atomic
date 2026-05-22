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
        className="w-full flex items-center gap-1.5 text-sm text-atomic-gray-500 hover:text-atomic-dark hover:bg-atomic-ice rounded-lg px-2 py-2 transition-colors mt-1"
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
        className="w-full px-3 py-2 text-sm border border-atomic-orange/40 rounded-lg focus:outline-none focus:ring-2 focus:ring-atomic-orange resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="px-3 py-1.5 bg-atomic-orange text-white text-sm font-medium rounded-lg hover:bg-atomic-orange/90 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Adicionando…' : 'Adicionar'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 text-atomic-gray-500 hover:text-atomic-dark transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </form>
  );
}
