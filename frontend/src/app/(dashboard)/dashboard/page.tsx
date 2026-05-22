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
          <div key={i} className="h-36 bg-atomic-gray-300/40 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-atomic-dark">Meus Quadros</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-atomic-orange text-white text-sm font-medium rounded-lg btn-glow-orange"
        >
          <Plus size={16} />
          Novo Quadro
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 bg-white border border-atomic-gray-300/40 rounded-xl p-4 space-y-3 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-atomic-dark/70">Novo quadro</h3>
          <div>
            <input
              autoFocus
              {...register('title')}
              placeholder="Título do quadro"
              className="w-full px-3 py-2 text-sm border border-atomic-gray-300/60 rounded-lg input-glow"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>
          <input
            {...register('description')}
            placeholder="Descrição (opcional)"
            className="w-full px-3 py-2 text-sm border border-atomic-gray-300/60 rounded-lg input-glow"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createBoard.isPending}
              className="px-4 py-2 bg-atomic-orange text-white text-sm font-medium rounded-lg hover:bg-atomic-orange/90 disabled:opacity-50 transition-colors"
            >
              {createBoard.isPending ? 'Criando…' : 'Criar'}
            </button>
            <button
              type="button"
              onClick={() => { reset(); setShowForm(false); }}
              className="px-4 py-2 text-sm text-atomic-gray-600 hover:text-stone-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {boards.length === 0 ? (
        <div className="text-center py-20 text-atomic-gray-500/70">
          <LayoutDashboard size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum quadro ainda. Crie o seu primeiro!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group relative bg-white/70 backdrop-blur-sm border border-atomic-gray-300/40 rounded-xl p-5 hover:border-atomic-orange/40 hover:shadow-[0_4px_20px_rgba(247,142,47,0.12)] hover:-translate-y-1 transition-all duration-200 cursor-pointer"
              onClick={() => router.push(`/dashboard/${board.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-atomic-dark group-hover:text-atomic-orange transition-colors">
                  {board.title}
                </h3>
                <button
                  className="opacity-0 group-hover:opacity-100 text-atomic-gray-500/70 hover:text-red-500 transition-all"
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
                <p className="text-sm text-atomic-gray-500 mb-3 line-clamp-2">{board.description}</p>
              )}
              <p className="text-xs text-atomic-gray-500/70 mt-auto">
                Criado{' '}
                {formatDistanceToNow(parseISO(board.createdAt), {
                  addSuffix: true,
                  locale: ptBR,
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
