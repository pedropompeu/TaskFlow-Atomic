'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, LayoutDashboard, Trash2 } from 'lucide-react';
import { useBoards, useCreateBoard, useDeleteBoard } from '@/hooks/useBoards';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const schema = z.object({
  title: z.string().min(1, 'Título obrigatório'),
  description: z.string().optional(),
});
type FormData = z.infer<typeof schema>;

export default function DashboardPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const { data: boards = [], isLoading } = useBoards();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  function onSubmit(data: FormData) {
    createBoard.mutate(data, {
      onSuccess: () => { reset(); setShowForm(false); },
    });
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-36 bg-brand-surface rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-brand-text-primary">Meus Quadros</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-accent text-brand-accent-fg text-sm font-medium rounded-lg hover:bg-brand-accent-hover transition-colors"
        >
          <Plus size={16} />
          Novo Quadro
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 bg-brand-surface border border-brand-border rounded-xl p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold text-brand-text-secondary">Novo quadro</h3>
          <div>
            <input
              autoFocus
              {...register('title')}
              placeholder="Título do quadro"
              className="w-full px-3 py-2 text-sm bg-brand-surface-elevated border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-brand-error">{errors.title.message}</p>
            )}
          </div>
          <input
            {...register('description')}
            placeholder="Descrição (opcional)"
            className="w-full px-3 py-2 text-sm bg-brand-surface-elevated border border-brand-border rounded-lg text-brand-text-primary placeholder-brand-text-muted focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createBoard.isPending}
              className="px-4 py-2 bg-brand-accent text-brand-accent-fg text-sm font-medium rounded-lg hover:bg-brand-accent-hover disabled:opacity-50 transition-colors"
            >
              {createBoard.isPending ? 'Criando…' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={() => { reset(); setShowForm(false); }}
              className="px-4 py-2 text-sm text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-20 text-brand-text-muted">
          <LayoutDashboard size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum quadro ainda. Crie o seu primeiro!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group relative bg-brand-surface border border-brand-border-subtle rounded-xl overflow-hidden hover:border-brand-border hover:bg-brand-surface-elevated hover:-translate-y-0.5 transition-all duration-200 cursor-pointer shadow-brand-card hover:shadow-brand-card-hover"
              onClick={() => router.push(`/dashboard/${board.id}`)}
            >
              {/* Accent top bar — sempre visível, intensifica no hover */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-brand-accent/40 via-brand-accent to-brand-accent/40 opacity-50 group-hover:opacity-100 transition-opacity duration-300" />

              {/* Decoração kanban — mini colunas fantasma */}
              <div className="absolute bottom-3 right-4 flex items-end gap-1 opacity-[0.07] pointer-events-none select-none">
                {[4, 6, 3, 5].map((h, i) => (
                  <div key={i} className="w-[3px] rounded-full bg-brand-text-primary" style={{ height: `${h * 4}px` }} />
                ))}
              </div>

              <div className="p-5">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-brand-text-primary group-hover:text-brand-accent transition-colors leading-snug">
                    {board.title}
                  </h3>
                  <button
                    className="opacity-0 group-hover:opacity-100 text-brand-text-muted hover:text-brand-error transition-all shrink-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteBoard.mutate(board.id);
                    }}
                    aria-label="Excluir quadro"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                {board.description && (
                  <p className="text-sm text-brand-text-secondary mb-3 line-clamp-2 leading-relaxed">{board.description}</p>
                )}
                <p className="text-xs text-brand-text-muted mt-auto">
                  Criado{' '}
                  {formatDistanceToNow(parseISO(board.createdAt), {
                    addSuffix: true,
                    locale: ptBR,
                  })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
