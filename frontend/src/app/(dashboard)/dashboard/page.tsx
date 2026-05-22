'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, LayoutDashboard, Trash2 } from 'lucide-react';
import { useBoards, useCreateBoard, useDeleteBoard } from '@/hooks/useBoards';
import { formatDistanceToNow, parseISO } from 'date-fns';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
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
          <div key={i} className="h-36 bg-gray-200 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">My Boards</h2>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New board
        </button>
      </div>

      {/* Create board form */}
      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mb-6 bg-white border border-gray-200 rounded-xl p-4 space-y-3 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-gray-700">New board</h3>
          <div>
            <input
              autoFocus
              {...register('title')}
              placeholder="Board title"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-600">{errors.title.message}</p>
            )}
          </div>
          <input
            {...register('description')}
            placeholder="Description (optional)"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={createBoard.isPending}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {createBoard.isPending ? 'Creating…' : 'Create'}
            </button>
            <button
              type="button"
              onClick={() => { reset(); setShowForm(false); }}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Boards grid */}
      {boards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <LayoutDashboard size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">No boards yet. Create your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group relative bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/${board.id}`)}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                  {board.title}
                </h3>
                <button
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteBoard.mutate(board.id);
                  }}
                  aria-label="Delete board"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {board.description && (
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{board.description}</p>
              )}
              <p className="text-xs text-gray-400 mt-auto">
                Created {formatDistanceToNow(parseISO(board.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
