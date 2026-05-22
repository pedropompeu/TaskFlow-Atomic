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
        className="w-full flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg px-2 py-2 transition-colors mt-1"
      >
        <Plus size={15} />
        Add card
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
        placeholder="Card title…"
        rows={2}
        className="w-full px-3 py-2 text-sm border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={isLoading || !title.trim()}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'Adding…' : 'Add card'}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>
    </form>
  );
}
